-- Cleanup duplicate chat messages
-- This script identifies and removes duplicate messages that have the same content and timestamp
-- within the same session, keeping only the first occurrence

-- First, let's see what duplicates exist
WITH duplicates AS (
  SELECT
    id,
    session_id,
    content,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY session_id, content, DATE_TRUNC('second', created_at)
      ORDER BY created_at ASC
    ) as row_num
  FROM chat_messages
)
SELECT
  session_id,
  content,
  COUNT(*) as duplicate_count
FROM duplicates
WHERE row_num > 1
GROUP BY session_id, content
ORDER BY duplicate_count DESC;

-- To actually delete duplicates, uncomment the following:
-- DELETE FROM chat_messages
-- WHERE id IN (
--   SELECT id
--   FROM (
--     SELECT
--       id,
--       ROW_NUMBER() OVER (
--         PARTITION BY session_id, content, DATE_TRUNC('second', created_at)
--         ORDER BY created_at ASC
--       ) as row_num
--     FROM chat_messages
--   ) t
--   WHERE row_num > 1
-- );
