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
CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER');

CREATE TYPE auth_provider_type AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');

CREATE TYPE user_status AS ENUM ('ACTIVE', 'BLOCKED');

CREATE TYPE vehicle_status_type AS ENUM ('AVAILABLE', 'BOOKED', 'MAINTENANCE');

CREATE TYPE package_type AS ENUM (
    'ADVENTURE', 
    'CULTURAL HERITAGE', 
    'WELLNESS & AYURVEDA', 
    'BEACH SIDE', 
    'HILL COUNTRY', 
    'SAFARI'
);

CREATE TYPE package_duration AS ENUM ('7 DAYS', '14 DAYS', '21 DAYS', '28 DAYS');

CREATE TYPE availability_status_type AS ENUM ('AVAILABLE', 'UNAVAILABLE');

CREATE TYPE tour_type_enum AS ENUM ('P2P', 'PACKAGE');

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

CREATE TYPE payment_method_type AS ENUM ('CASH', 'BANK_TRANSFER');

CREATE TYPE inquiry_status_type AS ENUM ('new', 'read', 'replied');

CREATE TYPE sender_role_type AS ENUM ('customer', 'admin');

-- =========================================================
-- Helper Trigger for updated_at
-- =========================================================
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

CREATE TRIGGER trg_user_updated_at
BEFORE UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Fleet & Vehicles
-- =========================================================
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
CREATE INDEX idx_place_geom ON place USING GIST (geom);

-- Trigger to keep coordinates and PostGIS point synchronized
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

CREATE TRIGGER trg_place_geom
BEFORE INSERT OR UPDATE ON place
FOR EACH ROW
EXECUTE FUNCTION set_place_geom();

CREATE TABLE activity (
    activity_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    description TEXT
);

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

CREATE TRIGGER trg_booking_geoms
BEFORE INSERT OR UPDATE ON booking
FOR EACH ROW
EXECUTE FUNCTION set_booking_geoms();

CREATE TABLE booking_package (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE,
    package_id INTEGER NOT NULL,
    CONSTRAINT fk_booking_package_booking FOREIGN KEY (booking_id) REFERENCES booking(booking_id),
    CONSTRAINT fk_booking_package_package FOREIGN KEY (package_id) REFERENCES package(package_id)
);

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

CREATE TABLE review_image (
    image_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    review_id INTEGER NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    CONSTRAINT fk_review_image_review FOREIGN KEY (review_id) REFERENCES review(review_id)
);

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

-- =========================================================
-- Migration 008: Procedures, Materialized View & Cronjobs
-- =========================================================

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
