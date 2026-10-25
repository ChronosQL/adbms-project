-- =========================================================
-- Migration: 003_pagination_functions.sql
-- Description: Upgrade fn_get_filtered_reviews to support p_limit, p_offset, and COUNT(*) OVER()
-- =========================================================

DROP FUNCTION IF EXISTS fn_get_filtered_reviews(INTEGER, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fn_get_filtered_reviews(INTEGER, VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_get_filtered_reviews(
    p_stars      INTEGER DEFAULT NULL,       -- e.g. 5, 4, or NULL for "All"
    p_tour_type  VARCHAR DEFAULT NULL,       -- e.g. 'PACKAGE', 'P2P', 'CUSTOM', or NULL
    p_sort       VARCHAR DEFAULT 'newest',   -- 'newest', 'highest', 'lowest'
    p_email      VARCHAR DEFAULT NULL,       -- for "My Reviews" tab
    p_limit      INTEGER DEFAULT NULL,       -- e.g. 12
    p_offset     INTEGER DEFAULT 0           -- e.g. 0, 12, 24...
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
    images           JSONB,
    total_count      INTEGER
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
        ) AS images,
        COUNT(*) OVER()::integer AS total_count
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
        r.created_at DESC
    LIMIT p_limit
    OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;
