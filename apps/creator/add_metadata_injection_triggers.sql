-- Metadata Injection Triggers for OAuth Account Type
-- This adds account_type to user metadata automatically when profiles are created
-- Bypasses session timeout issues by working at database level

-- Function to update user metadata with account type
CREATE OR REPLACE FUNCTION update_user_metadata_on_profile_creation()
RETURNS TRIGGER AS $$
DECLARE
  account_type_value TEXT;
BEGIN
  -- Determine account type based on which table triggered this
  IF TG_TABLE_NAME = 'user_buyers' THEN
    account_type_value := 'buyer';
  ELSIF TG_TABLE_NAME = 'user_creators' THEN
    account_type_value := 'creator';
  ELSE
    -- Unknown table, skip
    RETURN NEW;
  END IF;

  -- Log the metadata update
  RAISE LOG 'METADATA INJECTION: Updating user % with account_type: %', NEW.id, account_type_value;

  -- Update the auth.users metadata directly
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('account_type', account_type_value)
  WHERE id = NEW.id;

  -- Check if update was successful
  IF FOUND THEN
    RAISE LOG 'METADATA INJECTION: Successfully updated metadata for user %', NEW.id;
  ELSE
    RAISE WARNING 'METADATA INJECTION: Failed to find user % in auth.users', NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail profile creation if metadata update fails
  RAISE WARNING 'METADATA INJECTION: Failed to update metadata for user %: % (SQLSTATE: %)',
    NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove existing triggers if they exist
DROP TRIGGER IF EXISTS update_buyer_metadata_trigger ON user_buyers;
DROP TRIGGER IF EXISTS update_creator_metadata_trigger ON user_creators;

-- Create trigger for buyer profiles
CREATE TRIGGER update_buyer_metadata_trigger
  AFTER INSERT ON user_buyers
  FOR EACH ROW
  EXECUTE FUNCTION update_user_metadata_on_profile_creation();

-- Create trigger for creator profiles
CREATE TRIGGER update_creator_metadata_trigger
  AFTER INSERT ON user_creators
  FOR EACH ROW
  EXECUTE FUNCTION update_user_metadata_on_profile_creation();

-- Add helpful comments
COMMENT ON FUNCTION update_user_metadata_on_profile_creation() IS
'Automatically injects account_type into user metadata when profiles are created. Bypasses session timeout issues by working at database level.';

COMMENT ON TRIGGER update_buyer_metadata_trigger ON user_buyers IS
'Trigger to inject account_type=buyer into user metadata when buyer profile is created.';

COMMENT ON TRIGGER update_creator_metadata_trigger ON user_creators IS
'Trigger to inject account_type=creator into user metadata when creator profile is created.';

-- Verify the triggers were created
SELECT
    'Metadata Injection Triggers' as component,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%metadata_trigger'
ORDER BY event_object_table;

-- Show the function
SELECT
    'Metadata Injection Function' as component,
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_name = 'update_user_metadata_on_profile_creation';