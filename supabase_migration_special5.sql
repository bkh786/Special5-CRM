-- Run this in Supabase SQL Editor

-- 1. Leads Table Updates
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_id TEXT;
ALTER TABLE leads DROP COLUMN IF EXISTS parent_name;
ALTER TABLE leads DROP COLUMN IF EXISTS counsellor_name;

-- 2. Teachers Table Updates
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS hiring_status TEXT CHECK (hiring_status IN ('applied', 'hired', 'rejected')) DEFAULT 'applied';

-- Rename status to working_status if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teachers' AND column_name='status') THEN
        ALTER TABLE teachers RENAME COLUMN status TO working_status;
    END IF;
END $$;
