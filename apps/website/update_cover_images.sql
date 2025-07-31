-- SQL script to update title_image column with new cover images from scraped data
-- Maps english_title from CSV to title_name_en in titles table

-- Update cover images based on english_title matches
UPDATE titles 
SET title_image = CASE title_name_en
    WHEN 'Crush on You' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fe7fb3fbd-0da9-4f4b-ad21-1e993a85fd77%2F%EC%9E%AC%EB%B0%8C%EB%8B%88%EC%A7%9D%EC%82%AC%EB%9E%91_%EB%A9%94%EC%9D%B8%EB%B0%B0%EB%84%882(720x972).jpg&blockId=26d94fee-bc6c-40ca-bfce-893212ff8a87'
    WHEN 'ex_girlfriend' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F6d423e3e-9858-436f-80c6-dcfa7bd7d497%2F3bdf1cc2-5ab6-4557-b0df-9d0399a48021.png&blockId=accfd3ca-4bfe-4752-99ac-9ce830af9b47'
    WHEN 'dreaming' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F26e29323-72d8-4ac6-b0a9-882924b4c71e%2F%25EC%258B%259C%25EB%25A6%25AC%25EC%25A6%2588%25EC%25BB%25A4%25EB%25B2%2584.jpg&blockId=57f4b88b-af86-4cba-a862-8de1766b5e32'
    WHEN 'smartphone addict' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F84ad5aef-4b8a-41f2-9b45-3c8b12168343%2F%EA%B2%B0%EA%B3%BC.jpg&blockId=3981a656-dfa2-4e2d-b753-67e789aca774'
    WHEN 'steelman' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fbab31478-77cd-4a9e-8b30-e63f52eb65ff%2F%EC%98%81%EC%9B%85%EA%B0%95%EC%B2%A0%EB%82%A8.jpg&blockId=4ef21bb1-7019-4e57-9eb4-7cc2cc034b78'
    WHEN 'why_club' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fa348d74c-97a9-4833-9fbc-b3a1a2757b9c%2F%EB%8F%84%EB%8C%80%EC%B2%B4%EC%99%9C%EC%9D%B8%EA%B5%AC%EB%8B%A8.jpg&blockId=ecaefc64-6a21-4376-b7db-553ce1da77b2'
    WHEN 'butterfly_girl' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd04fca48-d0a8-4592-a589-ced9abd64c58%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80(%EC%84%B8%EB%A1%9C).png&blockId=c9162796-3494-4785-9290-4ca84e74d29b'
    WHEN 'Punk' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F6f3dd6e1-e074-4bf6-a7d5-d89c60c440b3%2F%EB%82%A0%EB%9D%BC%EB%A6%AC_%EC%BB%A4%EB%B2%84%ED%99%95%EC%A0%95.jpg&blockId=a87544d0-0bc0-416b-9213-7e800d6a3601'
    -- Add remaining entries as needed
    ELSE title_image -- Keep existing image if no match
END
WHERE title_name_en IN (
    'Crush on You',
    'ex_girlfriend', 
    'dreaming',
    'smartphone addict',
    'steelman',
    'why_club',
    'butterfly_girl',
    'Punk'
);

-- Alternative approach using individual UPDATE statements for better control:
/*
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fe7fb3fbd-0da9-4f4b-ad21-1e993a85fd77%2F%EC%9E%AC%EB%B0%8C%EB%8B%88%EC%A7%9D%EC%82%AC%EB%9E%91_%EB%A9%94%EC%9D%B8%EB%B0%B0%EB%84%882(720x972).jpg&blockId=26d94fee-bc6c-40ca-bfce-893212ff8a87' WHERE title_name_en = 'Crush on You';

UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F6d423e3e-9858-436f-80c6-dcfa7bd7d497%2F3bdf1cc2-5ab6-4557-b0df-9d0399a48021.png&blockId=accfd3ca-4bfe-4752-99ac-9ce830af9b47' WHERE title_name_en = 'ex_girlfriend';

UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F26e29323-72d8-4ac6-b0a9-882924b4c71e%2F%25EC%258B%259C%25EB%25A6%25AC%25EC%25A6%2588%25EC%25BB%25A4%25EB%25B2%2584.jpg&blockId=57f4b88b-af86-4cba-a862-8de1766b5e32' WHERE title_name_en = 'dreaming';

UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F84ad5aef-4b8a-41f2-9b45-3c8b12168343%2F%EA%B2%B0%EA%B3%BC.jpg&blockId=3981a656-dfa2-4e2d-b753-67e789aca774' WHERE title_name_en = 'smartphone addict';

UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fbab31478-77cd-4a9e-8b30-e63f52eb65ff%2F%EC%98%81%EC%9B%85%EA%B0%95%EC%B2%A0%EB%82%A8.jpg&blockId=4ef21bb1-7019-4e57-9eb4-7cc2cc034b78' WHERE title_name_en = 'steelman';

UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fa348d74c-97a9-4833-9fbc-b3a1a2757b9c%2F%EB%8F%84%EB%8C%80%EC%B2%B4%EC%99%9C%EC%9D%B8%EA%B5%AC%EB%8B%A8.jpg&blockId=ecaefc64-6a21-4376-b7db-553ce1da77b2' WHERE title_name_en = 'why_club';

UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd04fca48-d0a8-4592-a589-ced9abd64c58%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80(%EC%84%B8%EB%A1%9C).png&blockId=c9162796-3494-4785-9290-4ca84e74d29b' WHERE title_name_en = 'butterfly_girl';

UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F6f3dd6e1-e074-4bf6-a7d5-d89c60c440b3%2F%EB%82%A0%EB%9D%BC%EB%A6%AC_%EC%BB%A4%EB%B2%84%ED%99%95%EC%A0%95.jpg&blockId=a87544d0-0bc0-416b-9213-7e800d6a3601' WHERE title_name_en = 'Punk';
*/

-- Verification query to check updated records:
SELECT title_name_en, title_image, updated_at 
FROM titles 
WHERE title_name_en IN (
    'Crush on You',
    'ex_girlfriend', 
    'dreaming',
    'smartphone addict',
    'steelman',
    'why_club',
    'butterfly_girl',
    'Punk'
)
ORDER BY title_name_en;