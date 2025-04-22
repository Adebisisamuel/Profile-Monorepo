-- Add profile_image_url column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE users ADD COLUMN profile_image_url TEXT;
    END IF;
END $$;

-- Add logo_url column to churches table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'churches' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE churches ADD COLUMN logo_url TEXT;
    END IF;
END $$;