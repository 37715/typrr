-- Fix attempts table to allow snippet_id to be null for tricky_chars mode
-- This migration removes the NOT NULL constraint from snippet_id column

-- Remove NOT NULL constraint from snippet_id
ALTER TABLE attempts ALTER COLUMN snippet_id DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN attempts.snippet_id IS 'Snippet ID - can be null for special modes like tricky_chars';

-- Verify the change by checking table info
-- SELECT column_name, is_nullable, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'attempts' AND column_name = 'snippet_id';
