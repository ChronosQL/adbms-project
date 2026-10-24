-- Migration: 006_optimized_architecture.sql
-- Description: Comprehensive database-centric optimizations for Ceylon Best Tours (TechNova)
-- 1. Foreign key, composite thread, and partial indexes
-- 2. Data integrity constraints (valid date ranges, lowercase unique email)
-- 3. Canonical read projections (v_booking_details, v_booking_financial_summary, v_package_catalog)
-- 4. Intelligent functions (fn_get_available_vehicles, fn_get_places_nearby)
-- 5. Lifecycle and status audit triggers (trg_booking_milestones, trg_inquiry_on_reply, booking_status_history)

-- =========================================================
-- 1. High-Performance B-Tree & Partial Indexes
-- =========================================================

-- Child Foreign Key Indexes (Eliminates full table sequential scans on child joins)
CREATE INDEX IF NOT EXISTS idx_payment_booking_id ON payment(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_recorded_by ON payment(recorded_by);
CREATE INDEX IF NOT EXISTS idx_booking_package_pkg_id ON booking_package(package_id);
CREATE INDEX IF NOT EXISTS idx_booking_package_booking_id ON booking_package(booking_id);
CREATE INDEX IF NOT EXISTS idx_package_place_pkg_id ON package_place(package_id);
CREATE INDEX IF NOT EXISTS idx_package_place_place_id ON package_place(place_id);
CREATE INDEX IF NOT EXISTS idx_place_activity_place_id ON place_activity(place_id);
CREATE INDEX IF NOT EXISTS idx_place_activity_act_id ON place_activity(activity_id);
CREATE INDEX IF NOT EXISTS idx_contact_reply_inquiry_id ON contact_reply(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_booking_user_id ON booking(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_vehicle_id ON booking(vehicle_id);

-- Composite Thread Indexes (Loads thread messages pre-sorted off disk)
CREATE INDEX IF NOT EXISTS idx_contact_reply_thread ON contact_reply(inquiry_id, sent_at ASC);

-- Partial Indexes for Instant Dashboard Badges
CREATE INDEX IF NOT EXISTS idx_booking_pending 
ON booking(booking_status) 
WHERE booking_status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_payment_approved 
ON payment(booking_id, amount) 
WHERE status = 'APPROVED';

-- =========================================================
-- 2. Data Integrity Constraints
-- =========================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_booking_dates_valid') THEN
        ALTER TABLE booking ADD CONSTRAINT chk_booking_dates_valid CHECK (end_date >= start_date);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_unique_lower 
ON "user" (LOWER(email));

-- =========================================================
-- 3. Canonical Read Projections (Views)
-- =========================================================

-- 3.1 Single canonical view for bookings across admin and user portals
CREATE OR REPLACE VIEW v_booking_details AS
SELECT 
    b.booking_id,
    b.user_id,
    b.customer_name,
    b.contact_platform,
    b.contact_number,
    b.contact_platform2,
    b.contact_number2,
    b.tour_type,
    b.category_id,
    vc.category_name,
    b.vehicle_id,
    v.name AS vehicle_name,
    v.vehicle_number,
    b.start_date,
    b.end_date,
    b.pickup_time,
    b.start_location,
    b.end_location,
    b.pickup_lat,
    b.pickup_lng,
    b.dropoff_lat,
    b.dropoff_lng,
    b.total_days,
    b.days_required,
    b.luggage_10kg,
    b.luggage_25kg,
    b.luggage_35kg,
    b.no_of_adults,
    b.no_of_children,
    b.ages_of_children,
    b.quoted_price,
    b.additional_charges,
    (COALESCE(b.quoted_price, 0) + COALESCE(b.additional_charges, 0))::numeric(10,2) AS total_price,
    b.notes,
    b.tour_thoughts,
    b.admin_note,
    b.booking_date,
    b.booking_status,
    b.quoted_at,
    b.confirmed_at,
    b.tour_started_at,
    b.completed_at,
    b.closed_at,
    u.email,
    u.contact_number AS user_phone,
    u.emergency_name,
    u.emergency_phone,
    u.emergency_relationship,
    bp.package_id,
    p.title AS package_name
FROM booking b
INNER JOIN "user" u ON u.user_id = b.user_id
LEFT JOIN vehicle_category vc ON vc.category_id = b.category_id
LEFT JOIN vehicle v ON v.vehicle_id = b.vehicle_id
LEFT JOIN booking_package bp ON bp.booking_id = b.booking_id
LEFT JOIN package p ON p.package_id = bp.package_id;

-- 3.2 Canonical booking financial balance view
CREATE OR REPLACE VIEW v_booking_financial_summary AS
SELECT 
    b.booking_id,
    b.user_id,
    b.booking_status,
    COALESCE(b.quoted_price, 0)::numeric(10,2) AS quoted_price,
    COALESCE(b.additional_charges, 0)::numeric(10,2) AS additional_charges,
    (COALESCE(b.quoted_price, 0) + COALESCE(b.additional_charges, 0))::numeric(10,2) AS total_price,
    COALESCE(p.total_paid, 0)::numeric(10,2) AS total_paid,
    GREATEST(0, (COALESCE(b.quoted_price, 0) + COALESCE(b.additional_charges, 0)) - COALESCE(p.total_paid, 0))::numeric(10,2) AS outstanding_balance,
    CASE 
        WHEN COALESCE(p.total_paid, 0) = 0 THEN 'UNPAID'
        WHEN COALESCE(p.total_paid, 0) >= (COALESCE(b.quoted_price, 0) + COALESCE(b.additional_charges, 0)) THEN 'PAID'
        ELSE 'PARTIAL'
    END AS payment_status
FROM booking b
LEFT JOIN (
    SELECT booking_id, SUM(amount) AS total_paid
    FROM payment
    WHERE status = 'APPROVED'
    GROUP BY booking_id
) p ON p.booking_id = b.booking_id;

-- 3.3 High-speed JSONB package catalog projection
CREATE OR REPLACE VIEW v_package_catalog AS
SELECT 
    p.package_id,
    p.title,
    p.type,
    p.days,
    p.description,
    p.image_url,
    p.availability_status,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'place_id', pl.place_id,
                'name', pl.place_name,
                'image', pl.image_url,
                'dayNumber', pp.day_number,
                'latitude', COALESCE(pp.latitude, pl.latitude),
                'longitude', COALESCE(pp.longitude, pl.longitude)
            ) ORDER BY pp.day_number ASC
        ) FILTER (WHERE pl.place_id IS NOT NULL),
        '[]'::jsonb
    ) AS destinations,
    COUNT(pp.id)::integer AS total_places
FROM package p
LEFT JOIN package_place pp ON pp.package_id = p.package_id
LEFT JOIN place pl ON pl.place_id = pp.place_id
GROUP BY p.package_id;

-- =========================================================
-- 4. Intelligent Database Functions
-- =========================================================

-- 4.1 Fleet Availability Function (Prevents double-booking via daterange overlap)
DROP FUNCTION IF EXISTS fn_get_available_vehicles(INTEGER, DATE, DATE);
CREATE OR REPLACE FUNCTION fn_get_available_vehicles(
    p_category_id INTEGER,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    vehicle_id INTEGER,
    vehicle_name VARCHAR,
    vehicle_number VARCHAR,
    category_id INTEGER,
    category_name VARCHAR,
    adult_seats INTEGER,
    price_per_day NUMERIC
) 
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.vehicle_id,
        v.name AS vehicle_name,
        v.vehicle_number,
        v.category_id,
        vc.category_name,
        v.adult_seats,
        v.price_per_day
    FROM vehicle v
    INNER JOIN vehicle_category vc ON vc.category_id = v.category_id
    WHERE (p_category_id IS NULL OR v.category_id = p_category_id)
      AND v.vehicle_status = 'AVAILABLE'
      AND v.vehicle_id NOT IN (
          SELECT b.vehicle_id 
          FROM booking b
          WHERE b.vehicle_id IS NOT NULL
            AND b.booking_status IN ('CONFIRMED', 'TOUR_STARTED', 'ACCEPTED')
            AND daterange(b.start_date, b.end_date, '[]') && daterange(p_start_date, p_end_date, '[]')
      )
    ORDER BY v.name ASC;
END;
$$;

-- 4.2 PostGIS Proximity Search (Find places within radius km using spatial GIST index)
CREATE OR REPLACE FUNCTION fn_get_places_nearby(
    p_lat NUMERIC,
    p_lng NUMERIC,
    p_radius_km NUMERIC DEFAULT 25
) RETURNS TABLE (
    place_id INTEGER,
    place_name VARCHAR,
    distance_km NUMERIC,
    image_url VARCHAR,
    description TEXT
) 
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.place_id,
        p.place_name,
        ROUND((ST_Distance(p.geom::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000.0)::numeric, 1) AS distance_km,
        p.image_url,
        p.description
    FROM place p
    WHERE p.geom IS NOT NULL
      AND ST_DWithin(p.geom::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_km * 1000)
    ORDER BY distance_km ASC;
END;
$$;

-- =========================================================
-- 5. Lifecycle & Audit Triggers
-- =========================================================

-- 5.1 Milestone Timestamps Trigger on Booking
CREATE OR REPLACE FUNCTION set_booking_milestone_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
        IF NEW.booking_status = 'QUOTED' AND NEW.quoted_at IS NULL THEN
            NEW.quoted_at := CURRENT_TIMESTAMP;
        ELSIF NEW.booking_status = 'CONFIRMED' AND NEW.confirmed_at IS NULL THEN
            NEW.confirmed_at := CURRENT_TIMESTAMP;
        ELSIF NEW.booking_status = 'TOUR_STARTED' AND NEW.tour_started_at IS NULL THEN
            NEW.tour_started_at := CURRENT_TIMESTAMP;
        ELSIF NEW.booking_status = 'COMPLETED' AND NEW.completed_at IS NULL THEN
            NEW.completed_at := CURRENT_TIMESTAMP;
        ELSIF NEW.booking_status = 'CLOSED' AND NEW.closed_at IS NULL THEN
            NEW.closed_at := CURRENT_TIMESTAMP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_milestones ON booking;
CREATE TRIGGER trg_booking_milestones
BEFORE UPDATE OF booking_status ON booking
FOR EACH ROW EXECUTE FUNCTION set_booking_milestone_timestamps();

-- 5.2 Support Inquiry Reply Atomic Sync Trigger
CREATE OR REPLACE FUNCTION sync_inquiry_on_reply()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contact_inquiry
    SET status = 'replied', is_read = TRUE
    WHERE inquiry_id = NEW.inquiry_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inquiry_on_reply ON contact_reply;
CREATE TRIGGER trg_inquiry_on_reply
AFTER INSERT ON contact_reply
FOR EACH ROW EXECUTE FUNCTION sync_inquiry_on_reply();

-- 5.3 Booking Status Change History Table & Trigger
CREATE TABLE IF NOT EXISTS booking_status_history (
    history_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES booking(booking_id) ON DELETE CASCADE,
    old_status booking_status_type,
    new_status booking_status_type NOT NULL,
    admin_note TEXT,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booking_status_hist_booking_id ON booking_status_history(booking_id);

CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
        INSERT INTO booking_status_history (booking_id, old_status, new_status, admin_note)
        VALUES (NEW.booking_id, OLD.booking_status, NEW.booking_status, NEW.admin_note);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_status_history ON booking;
CREATE TRIGGER trg_booking_status_history
AFTER UPDATE OF booking_status ON booking
FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();
