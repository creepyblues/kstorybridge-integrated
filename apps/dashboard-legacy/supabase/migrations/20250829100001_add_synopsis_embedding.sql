-- Add synopsis_embedding column to match the updated code
ALTER TABLE titles ADD COLUMN IF NOT EXISTS synopsis_embedding vector(1536);