-- Step 1: Check if the table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'vector_search_analytics';

-- Step 2: Check what tables do exist in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Step 3: Try to create the table with minimal columns first
DROP TABLE IF EXISTS vector_search_analytics CASCADE;

CREATE TABLE vector_search_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    session_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Test if the basic table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vector_search_analytics'
ORDER BY ordinal_position;

-- Step 5: Try inserting a test record
INSERT INTO vector_search_analytics (query, session_id) 
VALUES ('test query', 'test-session-123');

-- Step 6: Verify the insert worked
SELECT * FROM vector_search_analytics;

-- Step 7: Clean up the test record
DELETE FROM vector_search_analytics WHERE query = 'test query';