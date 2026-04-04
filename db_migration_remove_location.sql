-- Database Migration Script: Run this script against the 'imms_db' database
-- This drops the residual PostGIS geometry column to prevent Hibernate Dialect incompatibilities.

ALTER TABLE property DROP COLUMN IF EXISTS location;
