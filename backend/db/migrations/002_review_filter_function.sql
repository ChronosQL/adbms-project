-- =========================================================
-- Migration: 002_review_filter_function.sql
-- Description: Review filtering function, upgraded star summary view, and supporting B-Tree indexes
-- =========================================================

-- 1. Review Filtering Function with Native JSON Aggregation
CREATE OR REPLACE FUNCTION fn_get_filtered_reviews(
    p_stars      INTEGER DEFAULT NULL,       -- e.g. 5, 4, or NULL for "All"
    p_tour_type  VARCHAR DEFAULT NULL,       -- e.g. 'PACKAGE', 'P2P', 'CUSTOM', or NULL
    p_sort       VARCHAR DEFAULT 'newest',   -- 'newest', 'highest', 'lowest'
    p_email      VARCHAR DEFAULT NULL        -- for "My Reviews" tab
)
RETURNS TABLE (
    review_id        INTEGER,
    booking_id       INTEGER,
    rating           INTEGER,
    driver_name      VARCHAR,
    title            VARCHAR,
    feedback         TEXT,
    created_at       TIMESTAMPTZ,
    customer_name    VARCHAR,
    customer_email   VARCHAR,
    customer_country VARCHAR,
    tour_type        tour_type_enum,
    tour_title       VARCHAR,
    images           JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.review_id,
        r.booking_id,
        r.rating,
        r.driver_name,
        r.title,
        r.feedback,
        r.created_at,
        u.name AS customer_name,
        u.email AS customer_email,
        u.country AS customer_country,
        b.tour_type,
        COALESCE(p.title, b.tour_type::text)::varchar AS tour_title,
        COALESCE(
            jsonb_agg(ri.image_url) FILTER (WHERE ri.image_url IS NOT NULL),
            '[]'::jsonb
        ) AS images
    FROM review r
    INNER JOIN "user" u ON u.user_id = r.user_id
    INNER JOIN booking b ON b.booking_id = r.booking_id
    LEFT JOIN booking_package bp ON bp.booking_id = b.booking_id
    LEFT JOIN package p ON p.package_id = bp.package_id
    LEFT JOIN review_image ri ON ri.review_id = r.review_id
    WHERE
        (p_stars IS NULL OR r.rating = p_stars)
        AND (
            p_tour_type IS NULL OR p_tour_type = '' 
            OR b.tour_type::text ILIKE p_tour_type
            OR (p_tour_type = 'CUSTOM' AND FALSE)
        )
        AND (p_email IS NULL OR LOWER(u.email) = LOWER(p_email))
    GROUP BY
        r.review_id, r.booking_id, r.rating, r.driver_name, r.title,
        r.feedback, r.created_at, u.name, u.email, u.country,
        b.tour_type, p.title
    ORDER BY
        CASE WHEN p_sort = 'highest' THEN r.rating END DESC,
        CASE WHEN p_sort = 'lowest'  THEN r.rating END ASC,
        r.created_at DESC;
END;
$$;

-- 2. Upgraded Summary View
DROP VIEW IF EXISTS review_star_summary CASCADE;
CREATE VIEW review_star_summary AS
SELECT
    COUNT(*) AS total_reviews,
    COALESCE(SUM(rating), 0) AS rating_sum,
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0) AS average_rating,
    COALESCE(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0) AS five_star_reviews,
    COALESCE(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0) AS four_star_reviews,
    COALESCE(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0) AS three_star_reviews,
    COALESCE(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0) AS two_star_reviews,
    COALESCE(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0) AS one_star_reviews
FROM review;

-- 3. Supporting B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_review_rating ON review (rating);
CREATE INDEX IF NOT EXISTS idx_review_created_at ON review (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_image_review_id ON review_image (review_id);
CREATE INDEX IF NOT EXISTS idx_review_user_id ON review (user_id);
