-- Make username nullable since we're moving to email-only auth
ALTER TABLE users
ALTER COLUMN username DROP NOT NULL;

-- Set a comment to document the change
COMMENT ON COLUMN users.username IS 'Legacy column - being phased out in favor of email-only authentication';