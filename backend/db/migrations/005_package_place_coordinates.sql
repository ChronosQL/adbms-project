-- Migration 005: Add coordinates and spatial geometry to package_place
ALTER TABLE package_place 
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS geom GEOMETRY(Point, 4326);

-- Spatial index for GIS queries
CREATE INDEX IF NOT EXISTS idx_package_place_geom ON package_place USING GIST (geom);

-- Trigger function to automatically maintain geom Point from latitude/longitude
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
