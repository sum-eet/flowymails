-- supabase/migrations/002_brand_roles.sql
-- Add color_roles, logo_url_light, tagline, social to brands table

ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url_light text;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS color_roles jsonb;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS social jsonb;
