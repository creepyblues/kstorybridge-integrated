-- Enable the disabled creator triggers
-- The debug shows triggers exist but are disabled (enabled = 0)

-- Check current trigger status
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    CASE t.tgenabled 
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED' 
        WHEN 'A' THEN 'ALWAYS'
        WHEN 'R' THEN 'REPLICA'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND (t.tgname LIKE '%creator%' OR t.tgname LIKE '%migration%')
ORDER BY t.tgname;

-- Enable the creator triggers
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_creator_created;
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_creator_updated;
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_account_type_migration;

-- Verify triggers are now enabled
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    CASE t.tgenabled 
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED' 
        WHEN 'A' THEN 'ALWAYS'
        WHEN 'R' THEN 'REPLICA'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND (t.tgname LIKE '%creator%' OR t.tgname LIKE '%migration%')
ORDER BY t.tgname;

-- Success message
SELECT 'Creator triggers have been enabled!' as message;