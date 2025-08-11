-- $1 = 0
-- $2 = 9500
-- $3 = '2025-08-11T23:04:40.262Z'
-- Update Is love delicious fried as well? (3cce946a-e45b-4c36-84b4-fc45b5ccec0e)
UPDATE titles 
SET views = $1, likes = $2, updated_at = $3
WHERE title_id = '3cce946a-e45b-4c36-84b4-fc45b5ccec0e';
