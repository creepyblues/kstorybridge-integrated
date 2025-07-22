
-- Create the missing enum types for buyer_role and ip_owner_role
CREATE TYPE public.buyer_role AS ENUM ('producer', 'executive', 'agent', 'content_scout', 'other');

CREATE TYPE public.ip_owner_role AS ENUM ('author', 'illustrator', 'publisher', 'studio', 'other');

-- Also create the genre and content_format enums that are referenced in the titles table
CREATE TYPE public.genre AS ENUM ('action', 'romance', 'comedy', 'drama', 'thriller', 'fantasy', 'sci_fi', 'horror', 'slice_of_life', 'historical', 'mystery', 'other');

CREATE TYPE public.content_format AS ENUM ('webtoon', 'webnovel', 'light_novel', 'manga', 'manhwa', 'other');
