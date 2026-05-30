-- Run this in Supabase SQL Editor

-- 1. Remove fee_per_student as it's no longer used
ALTER TABLE batches DROP COLUMN IF EXISTS fee_per_student;

-- 2. Update max_students to 5 for all existing batches and set as default
ALTER TABLE batches ALTER COLUMN max_students SET DEFAULT 5;
UPDATE batches SET max_students = 5;
