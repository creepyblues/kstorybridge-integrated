-- Run after applying 20260714001452_link_title_drafts_to_publications.sql:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/title_publication_linkage.sql

BEGIN;

DO $$
DECLARE
  v_creator_id constant uuid := '44444444-4444-4444-8444-444444444444';
  v_draft_id constant uuid := '55555555-5555-4555-8555-555555555555';
  v_title_id constant uuid := '66666666-6666-4666-8666-666666666666';
  v_second_title_id constant uuid := '77777777-7777-4777-8777-777777777777';
  duplicate_rejected boolean := false;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_creator_id,
    'authenticated',
    'authenticated',
    'publication-test@example.invalid',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

  INSERT INTO public.title_drafts (
    id,
    creator_id,
    draft_data,
    status,
    submitted_at
  ) VALUES (
    v_draft_id,
    v_creator_id,
    '{"title_name_kr":"테스트","title_name_en":"Test"}'::jsonb,
    'submitted',
    now()
  );

  INSERT INTO public.titles (
    title_id,
    creator_id,
    source_draft_id,
    title_name_kr,
    title_name_en,
    is_official_english_title,
    tagline,
    tagline_kr,
    synopsis,
    synopsis_kr,
    genre,
    genre_kr,
    content_format,
    tone,
    audience,
    age_rating,
    story_author,
    story_author_kr,
    art_author,
    art_author_kr,
    original_author,
    original_author_kr,
    script_title_kr,
    script_title_en,
    art_title_kr,
    art_title_en,
    underlying_novel_kr,
    underlying_novel_en,
    inspiration,
    important_issues,
    setting_description,
    world_lore,
    supernatural_concepts,
    character_details,
    story_structure,
    planned_ending,
    narrative_arc,
    rights,
    rights_holder_name,
    rights_holder_company,
    cp,
    keywords,
    comps,
    perfect_for,
    awards,
    sales_records,
    merchandise_deals,
    print_editions,
    print_edition_details,
    media_coverage,
    celebrity_endorsements,
    creator_achievements,
    views,
    likes,
    rating,
    rating_count,
    chapters,
    completed,
    title_image,
    title_url,
    note,
    note_kr,
    verified,
    priority
  ) VALUES (
    v_title_id,
    v_creator_id,
    v_draft_id,
    '테스트',
    'Test',
    true,
    'Tagline',
    '태그라인',
    'Synopsis',
    '시놉시스',
    ARRAY['drama'],
    ARRAY['드라마'],
    'webtoon',
    'dramatic',
    'adults',
    '15+',
    'Story Author',
    '글 작가',
    'Art Author',
    '그림 작가',
    'Original Author',
    '원작자',
    '스크립트',
    'Script',
    '아트',
    'Art',
    '원작 소설',
    'Underlying Novel',
    'Inspiration',
    'Issues',
    'Setting',
    'Lore',
    'Concepts',
    '[]'::jsonb,
    'Structure',
    'Ending',
    'Arc',
    'film_tv',
    'Rights Holder',
    'Rights Company',
    'CP',
    ARRAY['keyword'],
    ARRAY['Comparable'],
    'Adaptation',
    ARRAY['Award'],
    'Sales',
    'Merchandise',
    true,
    'Print details',
    'Coverage',
    'Endorsement',
    '{}'::jsonb,
    1,
    1,
    4.5,
    1,
    10,
    true,
    'https://example.invalid/image.jpg',
    'https://example.invalid/title',
    'Note',
    '메모',
    true,
    '2'
  );

  UPDATE public.title_drafts
  SET status = 'approved',
      approved_at = now(),
      published_title_id = v_title_id
  WHERE id = v_draft_id;

  IF NOT EXISTS (
    SELECT 1
    FROM public.title_drafts d
    JOIN public.titles t
      ON t.source_draft_id = d.id
     AND d.published_title_id = t.title_id
    WHERE d.id = v_draft_id
      AND t.title_id = v_title_id
  ) THEN
    RAISE EXCEPTION 'bidirectional publication linkage was not persisted';
  END IF;

  BEGIN
    INSERT INTO public.titles (
      title_id,
      creator_id,
      source_draft_id,
      title_name_kr,
      title_name_en
    ) VALUES (
      v_second_title_id,
      v_creator_id,
      v_draft_id,
      '중복',
      'Duplicate Source'
    );
  EXCEPTION WHEN unique_violation THEN
    duplicate_rejected := true;
  END;

  IF duplicate_rejected IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'duplicate source_draft_id was accepted';
  END IF;

  DELETE FROM public.titles t WHERE t.title_id = v_title_id;

  IF (SELECT published_title_id FROM public.title_drafts WHERE id = v_draft_id) IS NOT NULL THEN
    RAISE EXCEPTION 'deleting a publication did not clear the draft link';
  END IF;
END
$$;

ROLLBACK;
