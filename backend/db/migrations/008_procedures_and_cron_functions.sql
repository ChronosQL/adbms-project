-- Migration: 008_procedures_and_cron_functions.sql
-- Description: Stored procedures, reporting materialized view, and cron lifecycle functions for Ceylon Best Tours (TechNova)

-- =========================================================
-- 1. Materialized View for High-Performance Reporting
-- =========================================================

DROP MATERIALIZED VIEW IF EXISTS mv_monthly_financial_metrics CASCADE;

CREATE MATERIALIZED VIEW mv_monthly_financial_metrics AS
SELECT 
    EXTRACT(YEAR FROM received_date)::integer AS year,
    EXTRACT(MONTH FROM received_date)::integer AS month,
    COUNT(payment_id)::integer AS transaction_count,
    COALESCE(SUM(amount), 0)::numeric(12, 2) AS total_earnings
FROM payment
WHERE status = 'APPROVED'
GROUP BY EXTRACT(YEAR FROM received_date), EXTRACT(MONTH FROM received_date)
ORDER BY year DESC, month ASC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_financial_year_month 
ON mv_monthly_financial_metrics(year, month);

-- =========================================================
-- 2. Stored Procedures & Transactional Functions
-- =========================================================

-- 2.1 Atomic Tour Booking & Category / User Emergency Sync
CREATE OR REPLACE FUNCTION sp_create_booking(
    p_user_id INTEGER,
    p_customer_name VARCHAR,
    p_contact_platform VARCHAR,
    p_contact_number VARCHAR,
    p_contact_platform2 VARCHAR,
    p_contact_number2 VARCHAR,
    p_tour_type tour_type_enum,
    p_category_input VARCHAR,
    p_start_date DATE,
    p_end_date DATE,
    p_pickup_time TIME,
    p_start_location VARCHAR,
    p_end_location VARCHAR,
    p_pickup_lat NUMERIC,
    p_pickup_lng NUMERIC,
    p_dropoff_lat NUMERIC,
    p_dropoff_lng NUMERIC,
    p_total_days INTEGER,
    p_days_required INTEGER,
    p_luggage_10kg INTEGER,
    p_luggage_25kg INTEGER,
    p_luggage_35kg INTEGER,
    p_no_of_adults INTEGER,
    p_no_of_children INTEGER,
    p_ages_of_children TEXT,
    p_notes TEXT,
    p_tour_thoughts TEXT,
    p_package_id INTEGER DEFAULT NULL,
    p_emergency_name VARCHAR DEFAULT NULL,
    p_emergency_phone VARCHAR DEFAULT NULL,
    p_emergency_relationship VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    booking_id INTEGER,
    booking_ref VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_category_id INTEGER;
    v_booking_id INTEGER;
    v_is_pkg BOOLEAN;
    v_type_code VARCHAR;
BEGIN
    -- 1. Resolve Category ID (either integer string or category name)
    IF p_category_input ~ '^[0-9]+$' THEN
        v_category_id := p_category_input::integer;
    ELSE
        SELECT category_id INTO v_category_id
        FROM vehicle_category
        WHERE LOWER(category_name) = LOWER(p_category_input)
        LIMIT 1;

        IF v_category_id IS NULL THEN
            INSERT INTO vehicle_category (category_name)
            VALUES (p_category_input)
            RETURNING category_id INTO v_category_id;
        END IF;
    END IF;

    v_is_pkg := (p_tour_type = 'PACKAGE');

    -- 2. Insert Booking Record
    INSERT INTO booking (
        user_id, customer_name, contact_platform, contact_number, contact_platform2, contact_number2,
        tour_type, category_id,
        start_date, end_date, pickup_time,
        start_location, end_location,
        pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
        total_days, days_required,
        luggage_10kg, luggage_25kg, luggage_35kg,
        no_of_adults, no_of_children, ages_of_children,
        notes, tour_thoughts
    ) VALUES (
        p_user_id, p_customer_name, p_contact_platform, p_contact_number, p_contact_platform2, p_contact_number2,
        p_tour_type, v_category_id,
        p_start_date, p_end_date, p_pickup_time,
        CASE WHEN v_is_pkg THEN NULL ELSE p_start_location END,
        CASE WHEN v_is_pkg THEN NULL ELSE p_end_location END,
        CASE WHEN v_is_pkg THEN NULL ELSE p_pickup_lat END,
        CASE WHEN v_is_pkg THEN NULL ELSE p_pickup_lng END,
        CASE WHEN v_is_pkg THEN NULL ELSE p_dropoff_lat END,
        CASE WHEN v_is_pkg THEN NULL ELSE p_dropoff_lng END,
        p_total_days, p_days_required,
        p_luggage_10kg, p_luggage_25kg, p_luggage_35kg,
        p_no_of_adults, p_no_of_children, p_ages_of_children,
        p_notes, p_tour_thoughts
    )
    RETURNING booking.booking_id INTO v_booking_id;

    -- 3. Link Package if applicable
    IF v_is_pkg AND p_package_id IS NOT NULL THEN
        INSERT INTO booking_package (booking_id, package_id)
        VALUES (v_booking_id, p_package_id);
    END IF;

    -- 4. Update Emergency Contact Info if provided
    IF p_emergency_name IS NOT NULL OR p_emergency_phone IS NOT NULL OR p_emergency_relationship IS NOT NULL THEN
        UPDATE "user"
        SET emergency_name = COALESCE(p_emergency_name, emergency_name),
            emergency_phone = COALESCE(p_emergency_phone, emergency_phone),
            emergency_relationship = COALESCE(p_emergency_relationship, emergency_relationship)
        WHERE "user".user_id = p_user_id;
    END IF;

    -- 5. Return Details
    v_type_code := CASE WHEN v_is_pkg THEN 'PKG' ELSE 'P2P' END;
    RETURN QUERY SELECT v_booking_id, ('CBT-' || v_type_code || '-' || v_booking_id)::varchar;
END;
$$;

-- 2.2 Concurrency-Safe Quoting & Vehicle Collision Prevention
CREATE OR REPLACE FUNCTION sp_set_booking_quote(
    p_booking_id INTEGER,
    p_quoted_price NUMERIC,
    p_vehicle_id INTEGER,
    p_admin_note TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    current_status VARCHAR,
    current_price NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_status booking_status_type;
    v_price NUMERIC;
    v_start DATE;
    v_end DATE;
    v_quoted_at TIMESTAMPTZ;
BEGIN
    SELECT booking_status, quoted_price, start_date, end_date, quoted_at
    INTO v_status, v_price, v_start, v_end, v_quoted_at
    FROM booking
    WHERE booking_id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Booking not found.'::text, NULL::varchar, NULL::numeric;
        RETURN;
    END IF;

    IF v_status <> 'PENDING' OR v_quoted_at IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, 'A quote has already been provided for this booking or it is no longer pending.'::text, v_status::varchar, v_price;
        RETURN;
    END IF;

    -- Validate vehicle conflict if a vehicle is being assigned
    IF p_vehicle_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM booking b
            WHERE b.vehicle_id = p_vehicle_id
              AND b.booking_id <> p_booking_id
              AND b.booking_status IN ('CONFIRMED', 'TOUR_STARTED', 'ACCEPTED')
              AND daterange(b.start_date, b.end_date, '[]') && daterange(v_start, v_end, '[]')
        ) THEN
            RETURN QUERY SELECT FALSE, 'The selected vehicle is already reserved for overlapping dates.'::text, v_status::varchar, v_price;
            RETURN;
        END IF;
    END IF;

    -- Update booking
    UPDATE booking
    SET quoted_price = p_quoted_price,
        vehicle_id = p_vehicle_id,
        admin_note = p_admin_note,
        booking_status = 'QUOTED',
        quoted_at = NOW()
    WHERE booking_id = p_booking_id;

    RETURN QUERY SELECT TRUE, 'Quote sent to customer.'::text, 'QUOTED'::varchar, p_quoted_price;
END;
$$;

-- 2.3 Financial Recording & Real-Time Balance Reconciler
CREATE OR REPLACE FUNCTION sp_record_and_reconcile_payment(
    p_booking_id INTEGER,
    p_installment VARCHAR,
    p_amount NUMERIC,
    p_payment_method VARCHAR,
    p_received_date DATE,
    p_recorded_by INTEGER,
    p_status VARCHAR,
    p_slip_url TEXT,
    p_notes TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    payment_id INTEGER,
    remaining_balance NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_status booking_status_type;
    v_quoted NUMERIC;
    v_charges NUMERIC;
    v_total NUMERIC;
    v_paid NUMERIC;
    v_pending NUMERIC;
    v_available NUMERIC;
    v_payment_id INTEGER;
    v_inst VARCHAR(20);
    v_pay_status VARCHAR(20);
    v_method payment_method_type;
BEGIN
    SELECT booking_status, quoted_price, additional_charges
    INTO v_status, v_quoted, v_charges
    FROM booking
    WHERE booking_id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Booking not found.'::text, NULL::integer, 0::numeric;
        RETURN;
    END IF;

    IF v_status IN ('CLOSED', 'CANCELLED') THEN
        RETURN QUERY SELECT FALSE, ('Cannot record payment. Booking is already ' || LOWER(v_status::text) || '.')::text, NULL::integer, 0::numeric;
        RETURN;
    END IF;

    IF v_status NOT IN ('TOUR_STARTED', 'COMPLETED') THEN
        RETURN QUERY SELECT FALSE, ('Payments can only be recorded after the tour has started. Current booking status is ' || v_status::text || '.')::text, NULL::integer, 0::numeric;
        RETURN;
    END IF;

    v_total := COALESCE(v_quoted, 0) + COALESCE(v_charges, 0);

    SELECT 
        COALESCE(SUM(amount) FILTER (WHERE status = 'APPROVED'), 0),
        COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0)
    INTO v_paid, v_pending
    FROM payment
    WHERE booking_id = p_booking_id;

    v_available := GREATEST(0, v_total - v_paid - v_pending);

    IF p_amount > v_available THEN
        RETURN QUERY SELECT FALSE, ('Payment amount exceeds currently payable balance (' || ROUND(v_available, 2)::text || ').')::text, NULL::integer, v_available;
        RETURN;
    END IF;

    v_inst := UPPER(COALESCE(p_installment, 'FULL'));
    v_pay_status := UPPER(COALESCE(p_status, 'PENDING'));
    v_method := UPPER(p_payment_method)::payment_method_type;

    INSERT INTO payment (
        booking_id, installment, amount, payment_method, received_date, recorded_by, status, slip_url, notes
    ) VALUES (
        p_booking_id, v_inst, p_amount, v_method, COALESCE(p_received_date, CURRENT_DATE), p_recorded_by, v_pay_status, p_slip_url, p_notes
    )
    RETURNING payment.payment_id INTO v_payment_id;

    RETURN QUERY SELECT TRUE, 'Payment recorded successfully.'::text, v_payment_id, GREATEST(0, v_available - p_amount);
END;
$$;

-- 2.4 Batch Package & Itinerary Ingestion
CREATE OR REPLACE FUNCTION sp_create_package_with_itinerary(
    p_title VARCHAR,
    p_type package_type,
    p_days package_duration,
    p_description TEXT,
    p_image_url VARCHAR,
    p_availability availability_status_type,
    p_destinations JSONB
)
RETURNS TABLE (
    package_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_package_id INTEGER;
    v_dest JSONB;
    v_place_id INTEGER;
    v_act JSONB;
    v_act_id INTEGER;
    v_day INTEGER;
    v_lat NUMERIC;
    v_lng NUMERIC;
    v_idx INTEGER := 0;
BEGIN
    INSERT INTO package (title, type, days, description, image_url, availability_status)
    VALUES (p_title, p_type, p_days, p_description, p_image_url, COALESCE(p_availability, 'AVAILABLE'))
    RETURNING package.package_id INTO v_package_id;

    IF p_destinations IS NOT NULL AND jsonb_array_length(p_destinations) > 0 THEN
        FOR v_dest IN SELECT * FROM jsonb_array_elements(p_destinations)
        LOOP
            v_idx := v_idx + 1;
            v_day := COALESCE((v_dest->>'dayNumber')::integer, v_idx);
            v_lat := NULL;
            v_lng := NULL;

            IF v_dest->>'latitude' IS NOT NULL AND (v_dest->>'latitude') <> '' THEN
                v_lat := (v_dest->>'latitude')::numeric;
            ELSIF v_dest->>'lat' IS NOT NULL AND (v_dest->>'lat') <> '' THEN
                v_lat := (v_dest->>'lat')::numeric;
            END IF;

            IF v_dest->>'longitude' IS NOT NULL AND (v_dest->>'longitude') <> '' THEN
                v_lng := (v_dest->>'longitude')::numeric;
            ELSIF v_dest->>'lng' IS NOT NULL AND (v_dest->>'lng') <> '' THEN
                v_lng := (v_dest->>'lng')::numeric;
            END IF;

            INSERT INTO place (place_name, image_url, description, latitude, longitude)
            VALUES (
                v_dest->>'name',
                v_dest->>'image',
                v_dest->>'description',
                v_lat,
                v_lng
            )
            RETURNING place.place_id INTO v_place_id;

            INSERT INTO package_place (package_id, place_id, day_number, latitude, longitude)
            VALUES (v_package_id, v_place_id, v_day, v_lat, v_lng);

            IF v_dest->'activities' IS NOT NULL AND jsonb_typeof(v_dest->'activities') = 'array' THEN
                FOR v_act IN SELECT * FROM jsonb_array_elements(v_dest->'activities')
                LOOP
                    INSERT INTO activity (activity_name, phone, description)
                    VALUES (
                        COALESCE(v_act->>'activity_name', v_act #>> '{}'),
                        v_act->>'phone',
                        v_act->>'description'
                    )
                    RETURNING activity.activity_id INTO v_act_id;

                    INSERT INTO place_activity (place_id, activity_id)
                    VALUES (v_place_id, v_act_id);
                END LOOP;
            END IF;
        END LOOP;
    END IF;

    RETURN QUERY SELECT v_package_id;
END;
$$;

-- 2.5 Verified Tour Review Ingestion
CREATE OR REPLACE FUNCTION sp_submit_tour_review(
    p_user_id INTEGER,
    p_booking_id INTEGER,
    p_rating INTEGER,
    p_driver_name VARCHAR,
    p_title VARCHAR,
    p_feedback TEXT,
    p_images TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    review_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_status booking_status_type;
    v_review_id INTEGER;
    v_img TEXT;
BEGIN
    SELECT booking_status INTO v_status
    FROM booking
    WHERE booking_id = p_booking_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Booking not found for this user.'::text, NULL::integer;
        RETURN;
    END IF;

    IF v_status <> 'COMPLETED' THEN
        RETURN QUERY SELECT FALSE, 'Review allowed only for completed tours.'::text, NULL::integer;
        RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM review WHERE booking_id = p_booking_id) THEN
        RETURN QUERY SELECT FALSE, 'Review already exists for this booking.'::text, NULL::integer;
        RETURN;
    END IF;

    INSERT INTO review (user_id, booking_id, rating, driver_name, title, feedback)
    VALUES (p_user_id, p_booking_id, p_rating, p_driver_name, p_title, p_feedback)
    RETURNING review.review_id INTO v_review_id;

    IF p_images IS NOT NULL AND array_length(p_images, 1) > 0 THEN
        FOREACH v_img IN ARRAY p_images
        LOOP
            INSERT INTO review_image (review_id, image_url)
            VALUES (v_review_id, v_img);
        END LOOP;
    END IF;

    RETURN QUERY SELECT TRUE, 'Review submitted successfully.'::text, v_review_id;
END;
$$;

-- =========================================================
-- 3. Maintenance & Automated State Functions (Cronjobs)
-- =========================================================

-- 3.1 Advance Tour Lifecycle (CONFIRMED -> TOUR_STARTED -> COMPLETED)
CREATE OR REPLACE FUNCTION fn_advance_tour_lifecycle()
RETURNS TABLE (
    started_count INTEGER,
    completed_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_started INTEGER := 0;
    v_completed INTEGER := 0;
BEGIN
    WITH updated_started AS (
        UPDATE booking
        SET booking_status = 'TOUR_STARTED',
            tour_started_at = NOW()
        WHERE booking_status = 'CONFIRMED'
          AND start_date <= CURRENT_DATE
        RETURNING booking_id
    )
    SELECT COUNT(*) INTO v_started FROM updated_started;

    WITH updated_completed AS (
        UPDATE booking
        SET booking_status = 'COMPLETED',
            completed_at = NOW()
        WHERE booking_status = 'TOUR_STARTED'
          AND end_date < CURRENT_DATE
        RETURNING booking_id
    )
    SELECT COUNT(*) INTO v_completed FROM updated_completed;

    RETURN QUERY SELECT v_started, v_completed;
END;
$$;

-- 3.2 Expire Stale Quotes & Free Held Inventory
CREATE OR REPLACE FUNCTION fn_expire_stale_quotes(
    p_expiry_days INTEGER DEFAULT 7
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_expired_count INTEGER := 0;
BEGIN
    WITH expired AS (
        UPDATE booking
        SET booking_status = 'CANCELLED',
            admin_note = COALESCE(admin_note || ' | ', '') || 'Quote expired automatically due to customer inactivity.'
        WHERE booking_status = 'QUOTED'
          AND (
              quoted_at < NOW() - (p_expiry_days || ' days')::interval
              OR start_date <= CURRENT_DATE + interval '1 day'
          )
        RETURNING booking_id
    )
    SELECT COUNT(*) INTO v_expired_count FROM expired;

    RETURN v_expired_count;
END;
$$;

-- 3.3 Audit Pending Payment Slips
CREATE OR REPLACE FUNCTION fn_audit_pending_payments(
    p_threshold_hours INTEGER DEFAULT 48
)
RETURNS TABLE (
    payment_id INTEGER,
    booking_id INTEGER,
    customer_name VARCHAR,
    customer_phone VARCHAR,
    amount NUMERIC,
    hours_pending NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.payment_id,
        p.booking_id,
        b.customer_name,
        b.contact_number AS customer_phone,
        p.amount,
        ROUND(EXTRACT(EPOCH FROM (NOW() - p.received_date::timestamptz)) / 3600.0, 1) AS hours_pending
    FROM payment p
    INNER JOIN booking b ON b.booking_id = p.booking_id
    WHERE p.status = 'PENDING'
      AND p.received_date::timestamptz < NOW() - (p_threshold_hours || ' hours')::interval
    ORDER BY p.received_date ASC;
END;
$$;

-- 3.4 Concurrently Refresh Reporting Materialized Views
CREATE OR REPLACE FUNCTION fn_refresh_report_materialized_views()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_financial_metrics;
END;
$$;

-- 3.5 Database Health & Statistics Maintenance
CREATE OR REPLACE FUNCTION fn_run_db_maintenance()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    ANALYZE booking;
    ANALYZE payment;
    ANALYZE review;
    ANALYZE contact_reply;
    ANALYZE booking_status_history;
    RETURN 'Database maintenance analysis completed successfully.';
END;
$$;
