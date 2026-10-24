-- Connect to your database or create it first:
-- CREATE DATABASE tours;
-- \c tours

-- =========================================================
-- Extensions
-- =========================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- =========================================================
-- Custom ENUM Types
-- =========================================================
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER');

DROP TYPE IF EXISTS auth_provider_type CASCADE;
CREATE TYPE auth_provider_type AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');

DROP TYPE IF EXISTS user_status CASCADE;
CREATE TYPE user_status AS ENUM ('ACTIVE', 'BLOCKED');

DROP TYPE IF EXISTS vehicle_status_type CASCADE;
CREATE TYPE vehicle_status_type AS ENUM ('AVAILABLE', 'BOOKED', 'MAINTENANCE');

DROP TYPE IF EXISTS package_type CASCADE;
CREATE TYPE package_type AS ENUM (
    'ADVENTURE', 
    'CULTURAL HERITAGE', 
    'WELLNESS & AYURVEDA', 
    'BEACH SIDE', 
    'HILL COUNTRY', 
    'SAFARI'
);

DROP TYPE IF EXISTS package_duration CASCADE;
CREATE TYPE package_duration AS ENUM ('7 DAYS', '14 DAYS', '21 DAYS', '28 DAYS');

DROP TYPE IF EXISTS availability_status_type CASCADE;
CREATE TYPE availability_status_type AS ENUM ('AVAILABLE', 'UNAVAILABLE');

DROP TYPE IF EXISTS tour_type_enum CASCADE;
CREATE TYPE tour_type_enum AS ENUM ('P2P', 'PACKAGE');

DROP TYPE IF EXISTS booking_status_type CASCADE;
CREATE TYPE booking_status_type AS ENUM (
    'PENDING',
    'QUOTED',
    'ACCEPTED',
    'REJECTED',
    'CONFIRMED',
    'TOUR_STARTED',
    'COMPLETED',
    'CLOSED',
    'CANCELLED'
);

DROP TYPE IF EXISTS payment_installment_type CASCADE;

DROP TYPE IF EXISTS payment_method_type CASCADE;
CREATE TYPE payment_method_type AS ENUM ('CASH', 'BANK_TRANSFER');

DROP TYPE IF EXISTS inquiry_status_type CASCADE;
CREATE TYPE inquiry_status_type AS ENUM ('new', 'read', 'replied');

DROP TYPE IF EXISTS sender_role_type CASCADE;
CREATE TYPE sender_role_type AS ENUM ('customer', 'admin');

-- =========================================================
-- Helper Trigger for updated_at
-- =========================================================
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- User & Authentication
-- =========================================================
DROP TABLE IF EXISTS "user" CASCADE;
CREATE TABLE "user" (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL,
    role user_role DEFAULT 'CUSTOMER',
    contact_number VARCHAR(20) NULL,
    street_address VARCHAR(255) NULL,
    country VARCHAR(100) NULL,
    zipcode VARCHAR(20) NULL,
    emergency_name VARCHAR(150) NULL,
    emergency_phone VARCHAR(30) NULL,
    emergency_relationship VARCHAR(50) NULL,
    auth_provider auth_provider_type DEFAULT 'LOCAL',
    provider_id VARCHAR(255) NULL,
    status user_status DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_user_updated_at ON "user" CASCADE;
CREATE TRIGGER trg_user_updated_at
BEFORE UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Fleet & Vehicles
-- =========================================================
DROP TABLE IF EXISTS vehicle_category CASCADE;
CREATE TABLE vehicle_category (
    category_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    description TEXT,
    image_url TEXT,
    passenger_capacity VARCHAR(50),
    luggage_capacity VARCHAR(50),
    best_for VARCHAR(255),
    comfort_level VARCHAR(100),
    ac_available BOOLEAN DEFAULT FALSE,
    ideal_trip_types VARCHAR(255)
);

DROP TABLE IF EXISTS vehicle CASCADE;
CREATE TABLE vehicle (
    vehicle_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id INTEGER NOT NULL,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_license VARCHAR(100),
    name VARCHAR(255),
    color VARCHAR(50),
    manufactured_year INTEGER,
    adult_seats INTEGER,
    baby_seats INTEGER DEFAULT 0,
    luggage_capacity INTEGER,
    price_per_day NUMERIC(10,2),
    insurance_provider VARCHAR(100),
    insurance_start_date DATE,
    insurance_end_date DATE,
    image_url VARCHAR(255),
    vehicle_status vehicle_status_type DEFAULT 'AVAILABLE',
    brand VARCHAR(100),
    model VARCHAR(100),
    fuel_type VARCHAR(50),
    transmission VARCHAR(50),
    air_conditioning BOOLEAN DEFAULT FALSE,
    mileage INTEGER,
    engine_capacity VARCHAR(50),
    features TEXT,
    CONSTRAINT fk_vehicle_category FOREIGN KEY (category_id) REFERENCES vehicle_category(category_id)
);

-- =========================================================
-- Places & Activities
-- =========================================================
DROP TABLE IF EXISTS place CASCADE;
CREATE TABLE place (
    place_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    place_name VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    description TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    geom GEOMETRY(Point, 4326)
);

-- Spatial index for high-performance GIS queries
DROP INDEX IF EXISTS idx_place_geom CASCADE;
CREATE INDEX idx_place_geom ON place USING GIST (geom);

-- Trigger to keep coordinates and PostGIS point synchronized
DROP FUNCTION IF EXISTS set_place_geom() CASCADE;
CREATE OR REPLACE FUNCTION set_place_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- On INSERT: if coordinates are provided and geom is omitted, generate geom
        IF NEW.geom IS NULL AND NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
            NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
        -- On INSERT: if geom is provided and coordinates are omitted, extract coordinates
        ELSIF NEW.geom IS NOT NULL AND (NEW.longitude IS NULL OR NEW.latitude IS NULL) THEN
            NEW.longitude := ST_X(NEW.geom);
            NEW.latitude  := ST_Y(NEW.geom);
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        -- On UPDATE: if coordinates changed, recompute geom
        IF NEW.longitude IS DISTINCT FROM OLD.longitude OR NEW.latitude IS DISTINCT FROM OLD.latitude THEN
            IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
                NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
            ELSE
                NEW.geom := NULL;
            END IF;
        -- On UPDATE: if geom changed directly, update coordinates
        ELSIF NEW.geom IS DISTINCT FROM OLD.geom THEN
            IF NEW.geom IS NOT NULL THEN
                NEW.longitude := ST_X(NEW.geom);
                NEW.latitude  := ST_Y(NEW.geom);
            ELSE
                NEW.longitude := NULL;
                NEW.latitude  := NULL;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_place_geom ON place CASCADE;
CREATE TRIGGER trg_place_geom
BEFORE INSERT OR UPDATE ON place
FOR EACH ROW
EXECUTE FUNCTION set_place_geom();

DROP TABLE IF EXISTS activity CASCADE;
CREATE TABLE activity (
    activity_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    description TEXT
);

DROP TABLE IF EXISTS place_activity CASCADE;
CREATE TABLE place_activity (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    place_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    CONSTRAINT fk_place_activity_place FOREIGN KEY (place_id) REFERENCES place(place_id),
    CONSTRAINT fk_place_activity_activity FOREIGN KEY (activity_id) REFERENCES activity(activity_id)
);

-- =========================================================
-- Packages
-- =========================================================
DROP TABLE IF EXISTS package CASCADE;
CREATE TABLE package (
    package_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    type package_type NOT NULL,
    days package_duration NOT NULL,
    description TEXT,
    weather JSON,
    image_url VARCHAR(255),
    availability_status availability_status_type NOT NULL DEFAULT 'AVAILABLE'
);

DROP TABLE IF EXISTS package_place CASCADE;
CREATE TABLE package_place (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    package_id INTEGER NOT NULL,
    place_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    geom GEOMETRY(Point, 4326),
    CONSTRAINT fk_package_place_package FOREIGN KEY (package_id) REFERENCES package(package_id),
    CONSTRAINT fk_package_place_place FOREIGN KEY (place_id) REFERENCES place(place_id)
);

CREATE INDEX IF NOT EXISTS idx_package_place_geom ON package_place USING GIST (geom);

CREATE OR REPLACE FUNCTION set_package_place_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
            NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
        ELSE
            NEW.geom := NULL;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_package_place_geom ON package_place;
CREATE TRIGGER trg_package_place_geom
BEFORE INSERT OR UPDATE ON package_place
FOR EACH ROW
EXECUTE FUNCTION set_package_place_geom();

-- =========================================================
-- Bookings & Payments
-- =========================================================
DROP TABLE IF EXISTS booking CASCADE;
CREATE TABLE booking (
    booking_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    contact_platform VARCHAR(30) NOT NULL DEFAULT 'mobile',
    contact_number VARCHAR(150) NOT NULL,
    contact_platform2 VARCHAR(30) NULL,
    contact_number2 VARCHAR(150) NULL,
    tour_type tour_type_enum NOT NULL,
    category_id INTEGER NOT NULL,
    vehicle_id INTEGER NULL,

    -- Trip details
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pickup_time TIME,
    start_location VARCHAR(100),
    end_location VARCHAR(100),
    pickup_lat NUMERIC(10, 7) NULL,
    pickup_lng NUMERIC(10, 7) NULL,
    pickup_geom GEOMETRY(Point, 4326) NULL,
    dropoff_lat NUMERIC(10, 7) NULL,
    dropoff_lng NUMERIC(10, 7) NULL,
    dropoff_geom GEOMETRY(Point, 4326) NULL,

    -- Days
    total_days INTEGER NOT NULL,
    days_required INTEGER NOT NULL,

    -- Passengers & Luggage
    luggage_10kg INTEGER DEFAULT 0,
    luggage_25kg INTEGER DEFAULT 0,
    luggage_35kg INTEGER DEFAULT 0,
    no_of_adults INTEGER NOT NULL DEFAULT 1,
    no_of_children INTEGER NOT NULL DEFAULT 0,
    ages_of_children TEXT NULL,

    -- Pricing
    quoted_price NUMERIC(10,2) NULL,
    additional_charges NUMERIC(10,2) DEFAULT 0.00,

    notes TEXT,
    tour_thoughts TEXT,
    admin_note TEXT NULL,
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Status
    booking_status booking_status_type NOT NULL DEFAULT 'PENDING',

    -- Milestone timestamps
    quoted_at TIMESTAMPTZ NULL,
    confirmed_at TIMESTAMPTZ NULL,
    tour_started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    closed_at TIMESTAMPTZ NULL,

    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES "user"(user_id),
    CONSTRAINT fk_booking_category FOREIGN KEY (category_id) REFERENCES vehicle_category(category_id),
    CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id)
);

-- Spatial GIST indexes for booking
CREATE INDEX IF NOT EXISTS idx_booking_pickup_geom ON booking USING GIST (pickup_geom);
CREATE INDEX IF NOT EXISTS idx_booking_dropoff_geom ON booking USING GIST (dropoff_geom);

-- PostGIS synchronization trigger function for booking
DROP FUNCTION IF EXISTS set_booking_geoms() CASCADE;
CREATE OR REPLACE FUNCTION set_booking_geoms()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pickup_lng IS NOT NULL AND NEW.pickup_lat IS NOT NULL THEN
        NEW.pickup_geom := ST_SetSRID(ST_MakePoint(NEW.pickup_lng, NEW.pickup_lat), 4326);
    ELSE
        NEW.pickup_geom := NULL;
    END IF;

    IF NEW.dropoff_lng IS NOT NULL AND NEW.dropoff_lat IS NOT NULL THEN
        NEW.dropoff_geom := ST_SetSRID(ST_MakePoint(NEW.dropoff_lng, NEW.dropoff_lat), 4326);
    ELSE
        NEW.dropoff_geom := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_geoms ON booking CASCADE;
CREATE TRIGGER trg_booking_geoms
BEFORE INSERT OR UPDATE ON booking
FOR EACH ROW
EXECUTE FUNCTION set_booking_geoms();

DROP TABLE IF EXISTS booking_package CASCADE;
CREATE TABLE booking_package (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE,
    package_id INTEGER NOT NULL,
    CONSTRAINT fk_booking_package_booking FOREIGN KEY (booking_id) REFERENCES booking(booking_id),
    CONSTRAINT fk_booking_package_package FOREIGN KEY (package_id) REFERENCES package(package_id)
);

DROP TABLE IF EXISTS payment CASCADE;
CREATE TABLE payment (
    payment_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    installment VARCHAR(20) NOT NULL DEFAULT 'FULL',
    amount NUMERIC(10,2) NOT NULL,
    payment_method payment_method_type NOT NULL,
    received_date DATE,
    recorded_by INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    slip_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES booking(booking_id),
    CONSTRAINT fk_payment_user FOREIGN KEY (recorded_by) REFERENCES "user"(user_id)
);

-- =========================================================
-- Reviews
-- =========================================================
DROP TABLE IF EXISTS review CASCADE;
CREATE TABLE review (
    review_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    booking_id INTEGER NOT NULL UNIQUE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    driver_name VARCHAR(100),
    title VARCHAR(150),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES "user"(user_id),
    CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES booking(booking_id)
);

DROP TABLE IF EXISTS review_image CASCADE;
CREATE TABLE review_image (
    image_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    review_id INTEGER NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    CONSTRAINT fk_review_image_review FOREIGN KEY (review_id) REFERENCES review(review_id)
);

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

-- Table-Valued Review Filter Function
CREATE OR REPLACE FUNCTION fn_get_filtered_reviews(
    p_stars      INTEGER DEFAULT NULL,
    p_tour_type  VARCHAR DEFAULT NULL,
    p_sort       VARCHAR DEFAULT 'newest',
    p_email      VARCHAR DEFAULT NULL,
    p_limit      INTEGER DEFAULT NULL,
    p_offset     INTEGER DEFAULT 0
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

-- Supporting B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_review_rating ON review (rating);
CREATE INDEX IF NOT EXISTS idx_review_created_at ON review (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_image_review_id ON review_image (review_id);
CREATE INDEX IF NOT EXISTS idx_review_user_id ON review (user_id);

-- =========================================================
-- Support & Inquiries
-- =========================================================
DROP TABLE IF EXISTS contact_inquiry CASCADE;
CREATE TABLE contact_inquiry (
    inquiry_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sender_name VARCHAR(100) NOT NULL,
    sender_email VARCHAR(100) NOT NULL,
    sender_phone VARCHAR(20),
    subject VARCHAR(100),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    status inquiry_status_type NOT NULL DEFAULT 'new',
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS contact_reply CASCADE;
CREATE TABLE contact_reply (
    reply_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inquiry_id INTEGER NOT NULL,
    sender_role sender_role_type NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reply_inquiry FOREIGN KEY (inquiry_id) REFERENCES contact_inquiry(inquiry_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- High-Performance B-Tree, Composite & Partial Indexes
-- =========================================================
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

CREATE INDEX IF NOT EXISTS idx_contact_reply_thread ON contact_reply(inquiry_id, sent_at ASC);

CREATE INDEX IF NOT EXISTS idx_booking_pending ON booking(booking_status) WHERE booking_status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_payment_approved ON payment(booking_id, amount) WHERE status = 'APPROVED';

-- Data Integrity Constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_booking_dates_valid') THEN
        ALTER TABLE booking ADD CONSTRAINT chk_booking_dates_valid CHECK (end_date >= start_date);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_unique_lower ON "user" (LOWER(email));

-- =========================================================
-- Canonical Read Projections (Views)
-- =========================================================
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
-- Intelligent Functions
-- =========================================================
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
-- Lifecycle & Audit Triggers & History Table
-- =========================================================
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
