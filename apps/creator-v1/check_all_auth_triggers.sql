-- Check ALL triggers on auth.users table
SELECT 
    'All auth.users triggers' as step,
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation,
    action_condition
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Also check if any functions exist that should be used by triggers
SELECT 
    'Profile-related functions' as step,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND (routine_name LIKE '%profile%' OR routine_name LIKE '%user%')
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;