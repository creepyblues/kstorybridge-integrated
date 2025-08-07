-- Step 1: Add keywords column to titles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'titles' AND column_name = 'keywords') THEN
        ALTER TABLE titles ADD COLUMN keywords text[];
    END IF;
END $$;

-- Step 2: Update keywords field with extracted keyword data
-- Note: This uses the data from the keyword extraction results

-- Example updates based on the extraction results:
UPDATE titles SET keywords = ARRAY['serendipity', '세렌디피티', 'Drama', 'Growth'] WHERE title_id = 'bd688163-0a61-4e67-a125-95644e5be942';
UPDATE titles SET keywords = ARRAY['young', 'blood'] WHERE title_id = 'eda7e1d9-211a-4c9e-bd26-8eda72f58030';
UPDATE titles SET keywords = ARRAY['사랑', 'love', 'cooking', 'food', 'relationship', 'kitchen', 'delicious', 'romance', 'love story', 'romantic comedy', 'love triangle', 'dating', 'heartbreak', 'passion', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '4bb7c6b4-6d77-4b0b-badf-2e8bbfeebe37';

-- Continue with more updates...
-- (This would typically be generated programmatically from the JSON results)