-- =========================================================
-- Migration: 004_booking_coordinates.sql
-- Description: Add PostGIS coordinates and spatial triggers to booking table
-- =========================================================

ALTER TABLE booking
  ADD COLUMN IF NOT EXISTS pickup_lat NUMERIC(10, 7) NULL,
  ADD COLUMN IF NOT EXISTS pickup_lng NUMERIC(10, 7) NULL,
  ADD COLUMN IF NOT EXISTS pickup_geom GEOMETRY(Point, 4326) NULL,
  ADD COLUMN IF NOT EXISTS dropoff_lat NUMERIC(10, 7) NULL,
  ADD COLUMN IF NOT EXISTS dropoff_lng NUMERIC(10, 7) NULL,
  ADD COLUMN IF NOT EXISTS dropoff_geom GEOMETRY(Point, 4326) NULL;

-- Spatial GIST indexes
CREATE INDEX IF NOT EXISTS idx_booking_pickup_geom ON booking USING GIST (pickup_geom);
CREATE INDEX IF NOT EXISTS idx_booking_dropoff_geom ON booking USING GIST (dropoff_geom);

-- PostGIS synchronization trigger function
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
