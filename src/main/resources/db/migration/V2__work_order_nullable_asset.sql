-- Fix: allow asset_id to be null in work_order (multi-asset via join table now used)
ALTER TABLE work_order ALTER COLUMN asset_id DROP NOT NULL;
