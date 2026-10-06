-- Back up first. Apply once after 016, before deploying this release.
-- Existing quotes remain active. No financial or appointment data is removed.
ALTER TABLE quotes ADD COLUMN archived_at VARCHAR(24) NULL;
