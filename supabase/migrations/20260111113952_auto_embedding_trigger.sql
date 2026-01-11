-- Migration: Auto-generate embeddings for new/updated titles
-- Created: 2026-01-11
-- Purpose: Automatically trigger embedding generation when titles are inserted or updated
--
-- IMPORTANT: After applying this migration, you must store the service role key in vault:
-- SELECT vault.create_secret('supabase_service_role_key', 'your-service-role-key-here');

-- Step 1: Enable pg_net extension for async HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Step 2: Create the trigger function
CREATE OR REPLACE FUNCTION public.trigger_embedding_generation()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  service_key TEXT;
  request_id BIGINT;
BEGIN
  -- Edge function URL for this Supabase project
  edge_function_url := 'https://dlrnrgcoguxlkkcitlpd.supabase.co/functions/v1/regenerate-embeddings';

  -- Get service role key from vault
  -- NOTE: Must be stored first via: SELECT vault.create_secret('supabase_service_role_key', 'key');
  BEGIN
    SELECT decrypted_secret INTO service_key
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_service_role_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the INSERT/UPDATE
    RAISE WARNING '[AUTO_EMBED] Failed to get service key from vault: %', SQLERRM;
    RETURN NEW;
  END;

  IF service_key IS NULL THEN
    RAISE WARNING '[AUTO_EMBED] Service key not found in vault. Skipping embedding generation.';
    RETURN NEW;
  END IF;

  -- Fire async HTTP request to edge function (non-blocking)
  BEGIN
    SELECT net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('title_id', NEW.title_id::text)
    ) INTO request_id;

    RAISE LOG '[AUTO_EMBED] Triggered embedding generation for title_id: %, request_id: %',
      NEW.title_id, request_id;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the INSERT/UPDATE
    RAISE WARNING '[AUTO_EMBED] Failed to trigger embedding generation: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant execute permission
GRANT EXECUTE ON FUNCTION public.trigger_embedding_generation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_embedding_generation() TO service_role;

-- Step 4: Create INSERT trigger (new titles)
DROP TRIGGER IF EXISTS auto_generate_embedding_on_insert ON public.titles;
CREATE TRIGGER auto_generate_embedding_on_insert
AFTER INSERT ON public.titles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_embedding_generation();

-- Step 5: Create UPDATE trigger (content changes only)
-- Only fires when fields that affect embeddings are changed
DROP TRIGGER IF EXISTS auto_generate_embedding_on_update ON public.titles;
CREATE TRIGGER auto_generate_embedding_on_update
AFTER UPDATE ON public.titles
FOR EACH ROW
WHEN (
  (OLD.title_name_en IS DISTINCT FROM NEW.title_name_en) OR
  (OLD.title_name_kr IS DISTINCT FROM NEW.title_name_kr) OR
  (OLD.synopsis IS DISTINCT FROM NEW.synopsis) OR
  (OLD.synopsis_kr IS DISTINCT FROM NEW.synopsis_kr) OR
  (OLD.genre IS DISTINCT FROM NEW.genre) OR
  (OLD.tone IS DISTINCT FROM NEW.tone) OR
  (OLD.perfect_for IS DISTINCT FROM NEW.perfect_for) OR
  (OLD.audience IS DISTINCT FROM NEW.audience)
)
EXECUTE FUNCTION public.trigger_embedding_generation();

-- Step 6: Add comment for documentation
COMMENT ON FUNCTION public.trigger_embedding_generation() IS
'Automatically triggers embedding generation for titles via edge function.
Requires supabase_service_role_key to be stored in vault.
Created: 2026-01-11';

COMMENT ON TRIGGER auto_generate_embedding_on_insert ON public.titles IS
'Auto-generates embedding when a new title is created';

COMMENT ON TRIGGER auto_generate_embedding_on_update ON public.titles IS
'Auto-regenerates embedding when title content (name, synopsis, genre, tone, audience) changes';
