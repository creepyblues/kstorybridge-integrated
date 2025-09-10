-- Simple trigger enablement (run with postgres/admin role)
-- This should work with the postgres role you're using

ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_creator_created;
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_creator_updated; 
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_account_type_migration;