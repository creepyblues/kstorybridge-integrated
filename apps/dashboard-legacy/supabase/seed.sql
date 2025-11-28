-- ============================================================
-- KStoryBridge Test Data Seed File
-- ============================================================
-- Purpose: Populate local Supabase with test data for development
-- Usage: npx supabase db reset (automatically runs this file)
-- Created: 2025-10-25
-- ============================================================

-- ============================================================
-- SECTION 1: Test Users (Buyers & Creators)
-- ============================================================

-- Test Buyer - Basic Tier
INSERT INTO user_buyers (email, full_name, buyer_company, buyer_role, tier, requested)
VALUES
  ('test-buyer-basic@testcompany.com', 'Test Buyer Basic', 'Test Company LLC', 'Producer', 'basic', false),
  ('test-buyer-basic-2@testcompany.com', 'Test Buyer Basic Two', 'Test Studios', 'Development Executive', 'basic', false);

-- Test Buyer - Pro Tier
INSERT INTO user_buyers (email, full_name, buyer_company, buyer_role, tier, requested)
VALUES
  ('test-buyer-pro@testcompany.com', 'Test Buyer Pro', 'Premium Studios', 'Senior Producer', 'pro', false),
  ('test-buyer-pro-2@testcompany.com', 'Test Buyer Pro Two', 'Elite Media', 'VP of Development', 'pro', false);

-- Test Buyer - Suite Tier
INSERT INTO user_buyers (email, full_name, buyer_company, buyer_role, tier, requested)
VALUES
  ('test-buyer-suite@testcompany.com', 'Test Buyer Suite', 'Top Tier Productions', 'Executive Producer', 'suite', false);

-- Test Creators - Authors
INSERT INTO user_creators (email, full_name, pen_name, ip_owner_role, ip_owner_company, website_url, invitation_status)
VALUES
  ('test-creator-author@gmail.com', 'Test Author', 'Test Pen Name', 'author', NULL, 'https://example.com', 'active'),
  ('test-creator-author-2@gmail.com', 'Test Author Two', 'Another Pen Name', 'author', NULL, NULL, 'invited');

-- Test Creators - Agents
INSERT INTO user_creators (email, full_name, pen_name, ip_owner_role, ip_owner_company, website_url, invitation_status)
VALUES
  ('test-creator-agent@agency.com', 'Test Agent', 'Test Agency', 'agent', 'Test Literary Agency', 'https://testagency.com', 'active'),
  ('test-creator-agent-2@agency.com', 'Test Agent Two', 'Premium Agency', 'agent', 'Premium Literary Services', NULL, 'invited');

-- ============================================================
-- SECTION 2: Sample Titles (50 titles across different genres)
-- ============================================================

-- Romance Webtoons (10 titles)
INSERT INTO titles (
  title_name_en, title_name_kr, description, synopsis, tagline,
  author, genre, content_format, chapters, completed,
  views, likes, rating, rating_count,
  perfect_for, tone, audience, tags
) VALUES
  ('Love in Seoul', '서울의 사랑', 'A romantic comedy about two rivals who fall in love',
   'Two marketing executives compete for the same promotion, only to discover they''re perfect for each other.',
   'When rivalry turns to romance',
   'Kim Min-ji', 'Romance', 'webtoon', 120, true,
   5000000, 150000, 9.2, 45000,
   'Fans of romantic comedies and workplace dramas', 'Light, Funny, Heartwarming', 'Young Adult',
   ARRAY['romance', 'comedy', 'workplace', 'enemies-to-lovers']),

  ('Midnight Confession', '자정의 고백', 'A late-night radio host receives mysterious love letters',
   'A popular radio host starts receiving anonymous love letters that reference intimate details of her life.',
   'Love finds you when you least expect it',
   'Park Ji-won', 'Romance', 'webtoon', 85, true,
   3200000, 98000, 8.9, 32000,
   'Fans of mystery romance and slow burns', 'Mysterious, Romantic, Emotional', 'New Adult',
   ARRAY['romance', 'mystery', 'slice-of-life']),

  ('Second Chance Summer', '두 번째 여름', 'High school sweethearts reunite after 10 years',
   'When a successful lawyer returns to her hometown, she runs into her first love who never left.',
   'Some love stories deserve a second chapter',
   'Lee Soo-jin', 'Romance', 'webtoon', 95, true,
   4100000, 125000, 9.1, 38000,
   'Fans of second-chance romance and reunions', 'Nostalgic, Heartwarming, Emotional', 'Adult',
   ARRAY['romance', 'drama', 'second-chance', 'reunion']),

  ('Coffee & Chemistry', '커피와 케미스트리', 'A barista and a chemistry professor discover love',
   'A struggling artist working as a barista catches the eye of a quiet chemistry professor.',
   'The perfect blend',
   'Choi Hye-jin', 'Romance', 'webtoon', 78, false,
   2800000, 87000, 8.7, 28000,
   'Fans of slow-burn romance and smart humor', 'Sweet, Thoughtful, Uplifting', 'New Adult',
   ARRAY['romance', 'slice-of-life', 'coffee-shop', 'academia']),

  ('Royal Heartbeat', '왕실의 심장', 'A commoner falls for a prince in modern Korea',
   'When a university student accidentally saves a prince''s life, she gets pulled into the royal world.',
   'Love knows no status',
   'Kim So-ra', 'Romance', 'webtoon', 110, false,
   6500000, 210000, 9.4, 58000,
   'Fans of royal romance and Cinderella stories', 'Dreamy, Dramatic, Romantic', 'Young Adult',
   ARRAY['romance', 'royal', 'modern', 'class-difference']),

  ('The Last Letter', '마지막 편지', 'A novelist finds love through anonymous letters',
   'A bestselling author receives mysterious fan letters that inspire her next novel and change her life.',
   'Every word brought them closer',
   'Yoon Mi-ra', 'Romance', 'webtoon', 102, true,
   3900000, 112000, 8.8, 35000,
   'Fans of epistolary romance and writer stories', 'Poetic, Emotional, Introspective', 'Adult',
   ARRAY['romance', 'letters', 'writers', 'slow-burn']),

  ('Starlight Promise', '별빛 약속', 'Childhood friends separated by fame reunite',
   'A K-pop idol secretly reconnects with his childhood friend who doesn''t know his real identity.',
   'Under the stars, we made a promise',
   'Jung Ha-na', 'Romance', 'webtoon', 88, false,
   7200000, 245000, 9.3, 62000,
   'Fans of celebrity romance and childhood friends', 'Dreamy, Bittersweet, Heartfelt', 'Young Adult',
   ARRAY['romance', 'celebrity', 'childhood-friends', 'k-pop']),

  ('Raining Hearts', '비 내리는 마음', 'Two strangers share an umbrella and a destiny',
   'A chance encounter on a rainy day leads to an unexpected romance that changes two lives forever.',
   'Sometimes the best meetings happen by chance',
   'Kang Su-bin', 'Romance', 'webtoon', 65, true,
   2500000, 76000, 8.6, 25000,
   'Fans of meet-cute stories and fate romance', 'Gentle, Hopeful, Touching', 'New Adult',
   ARRAY['romance', 'slice-of-life', 'fate', 'meet-cute']),

  ('Parallel Hearts', '평행한 마음', 'A romance that transcends parallel universes',
   'Two people keep meeting across different timelines, always drawn to each other but never able to stay together.',
   'Love finds a way, even across universes',
   'Im Da-eun', 'Romance', 'webtoon', 115, false,
   5800000, 178000, 9.0, 48000,
   'Fans of sci-fi romance and multiverse stories', 'Philosophical, Romantic, Mind-bending', 'Adult',
   ARRAY['romance', 'sci-fi', 'multiverse', 'star-crossed']),

  ('Autumn in Your Eyes', '너의 눈 속 가을', 'A photographer captures more than images',
   'A nature photographer on a mountain retreat falls for a mysterious artist escaping city life.',
   'In your eyes, I found home',
   'Oh Yeon-ju', 'Romance', 'webtoon', 72, true,
   3100000, 94000, 8.9, 30000,
   'Fans of nature romance and healing stories', 'Peaceful, Beautiful, Healing', 'Adult',
   ARRAY['romance', 'nature', 'photography', 'healing']);

-- Action/Thriller (10 titles)
INSERT INTO titles (
  title_name_en, title_name_kr, description, synopsis, tagline,
  author, genre, content_format, chapters, completed,
  views, likes, rating, rating_count,
  perfect_for, tone, audience, tags
) VALUES
  ('Shadow Hunter', '그림자 사냥꾼', 'Elite assassin hunts supernatural threats',
   'A former special forces operative is recruited to hunt creatures that exist in the shadows of society.',
   'When darkness rises, she strikes',
   'Jang Hyuk', 'Action', 'webtoon', 145, false,
   8500000, 320000, 9.5, 78000,
   'Fans of dark action and supernatural thrillers', 'Dark, Intense, Gritty', 'Mature',
   ARRAY['action', 'thriller', 'supernatural', 'female-lead']),

  ('Neon Blade', '네온 블레이드', 'Cyberpunk swordsman in future Seoul',
   'In 2089 Seoul, a master swordsman battles corporate conspiracies in the neon-lit streets.',
   'The future cuts both ways',
   'Shin Tae-yang', 'Action', 'webtoon', 98, false,
   6700000, 245000, 9.2, 65000,
   'Fans of cyberpunk and martial arts', 'Stylish, Fast-paced, Dark', 'Adult',
   ARRAY['action', 'cyberpunk', 'swords', 'sci-fi']),

  ('Red Phoenix', '붉은 불사조', 'Female spy infiltrates criminal organization',
   'An undercover agent must maintain her cover while taking down a global crime syndicate from within.',
   'She burns bright in the darkness',
   'Kim Ye-jin', 'Thriller', 'webtoon', 112, true,
   5400000, 187000, 9.0, 52000,
   'Fans of spy thrillers and strong female leads', 'Suspenseful, Smart, Intense', 'Mature',
   ARRAY['thriller', 'spy', 'action', 'female-lead']),

  ('Ghost Protocol', '유령 프로토콜', 'Hacker fights against corrupt tech giant',
   'A brilliant hacker discovers her company''s dark secrets and becomes a digital vigilante.',
   'In the network, no one can hear you scream',
   'Park Min-woo', 'Thriller', 'webtoon', 87, false,
   4200000, 156000, 8.8, 44000,
   'Fans of tech thrillers and hacker stories', 'Tech-savvy, Tense, Modern', 'Adult',
   ARRAY['thriller', 'hacking', 'technology', 'conspiracy']),

  ('Iron Fist Dynasty', '철권 왕조', 'Underground fighter uncovers family legacy',
   'A street fighter discovers he''s heir to an ancient martial arts clan and must defend his birthright.',
   'Blood and honor demand a price',
   'Kwon Dae-ho', 'Action', 'webtoon', 125, false,
   7100000, 268000, 9.3, 71000,
   'Fans of martial arts and legacy stories', 'Brutal, Epic, Traditional', 'Mature',
   ARRAY['action', 'martial-arts', 'legacy', 'fighting']),

  ('Midnight Delivery', '자정 배달', 'Delivery driver solves crimes at night',
   'A night-shift delivery driver accidentally witnesses crimes and becomes an unlikely detective.',
   'Every package has a story',
   'Lee Sang-jun', 'Thriller', 'webtoon', 78, true,
   3800000, 142000, 8.7, 38000,
   'Fans of mystery thrillers and ordinary heroes', 'Gritty, Realistic, Suspenseful', 'Adult',
   ARRAY['thriller', 'mystery', 'slice-of-life', 'crime']),

  ('Viper Squad', '바이퍼 스쿼드', 'Elite female tactical team',
   'An all-female special forces unit tackles the most dangerous missions no one else will take.',
   'They strike fast and disappear',
   'Yoon Seo-hyun', 'Action', 'webtoon', 104, false,
   6200000, 224000, 9.1, 58000,
   'Fans of military action and team dynamics', 'Tactical, Intense, Empowering', 'Mature',
   ARRAY['action', 'military', 'female-leads', 'teamwork']),

  ('The Last Conductor', '마지막 차장', 'Train conductor stops terrorist plot',
   'A subway conductor must use his knowledge of the transit system to stop a city-wide terror attack.',
   'All aboard for survival',
   'Cho Jung-min', 'Thriller', 'webtoon', 68, true,
   2900000, 98000, 8.6, 29000,
   'Fans of real-time thrillers and ordinary heroes', 'Tense, Real-time, Heart-pounding', 'Adult',
   ARRAY['thriller', 'terrorism', 'real-time', 'subway']),

  ('Broken Crown', '부서진 왕관', 'Betrayed prince seeks revenge',
   'A prince betrayed by his own family returns from exile to reclaim his throne through force.',
   'A kingdom divided, a crown reclaimed',
   'Nam Ki-su', 'Action', 'novel', 156, true,
   4600000, 172000, 8.9, 46000,
   'Fans of revenge stories and political intrigue', 'Epic, Dark, Vengeful', 'Mature',
   ARRAY['action', 'revenge', 'royal', 'political']),

  ('Silent Witness', '침묵하는 목격자', 'Deaf woman witnesses murder',
   'A deaf artist becomes the only witness to a murder and must communicate what she saw to survive.',
   'She saw everything but can''t tell anyone',
   'Han Ji-su', 'Thriller', 'webtoon', 82, false,
   3500000, 128000, 8.8, 35000,
   'Fans of psychological thrillers and disability representation', 'Tense, Psychological, Unique', 'Adult',
   ARRAY['thriller', 'murder', 'disability', 'psychological']);

-- Fantasy (10 titles)
INSERT INTO titles (
  title_name_en, title_name_kr, description, synopsis, tagline,
  author, genre, content_format, chapters, completed,
  views, likes, rating, rating_count,
  perfect_for, tone, audience, tags
) VALUES
  ('The Last Mage', '마지막 마법사', 'Final mage in a world that forgot magic',
   'In a modern world where magic has faded, the last practicing mage must stop an ancient evil from returning.',
   'When magic fades, one spark remains',
   'Seo Min-ah', 'Fantasy', 'webtoon', 132, false,
   9200000, 385000, 9.6, 88000,
   'Fans of urban fantasy and chosen one stories', 'Epic, Magical, Emotional', 'Young Adult',
   ARRAY['fantasy', 'magic', 'urban-fantasy', 'chosen-one']),

  ('Dragon King''s Heir', '용왕의 후예', 'College student discovers dragon heritage',
   'A struggling college student learns he''s descended from the Dragon King and must claim his birthright.',
   'Ancient blood awakens',
   'Park Dong-su', 'Fantasy', 'webtoon', 118, false,
   7800000, 298000, 9.4, 72000,
   'Fans of dragon stories and heritage reveals', 'Majestic, Powerful, Coming-of-age', 'Young Adult',
   ARRAY['fantasy', 'dragons', 'heritage', 'power']),

  ('Moonlight Academy', '달빛 아카데미', 'Secret school for supernatural students',
   'A normal girl accidentally enrolls in a hidden academy where supernatural beings learn to control their powers.',
   'Where magic meets education',
   'Kim Da-hee', 'Fantasy', 'webtoon', 156, true,
   10500000, 442000, 9.5, 95000,
   'Fans of school fantasy and magical academies', 'Whimsical, Adventurous, Fun', 'Young Adult',
   ARRAY['fantasy', 'school', 'magic', 'supernatural']),

  ('Spirit Walker', '영혼 보행자', 'Shaman helps spirits find peace',
   'A young shaman balances her normal life while helping restless spirits cross over to the afterlife.',
   'Between worlds, she finds her purpose',
   'Jung Yeon-soo', 'Fantasy', 'webtoon', 94, false,
   5600000, 198000, 9.0, 54000,
   'Fans of spiritual fantasy and Korean folklore', 'Mystical, Touching, Cultural', 'Young Adult',
   ARRAY['fantasy', 'spirits', 'shaman', 'folklore']),

  ('Tower of Trials', '시련의 탑', 'Climb the tower or die trying',
   'Players worldwide are summoned to climb a mysterious tower where each floor is a deadly trial.',
   'Only the strongest survive',
   'Choi Jae-hyun', 'Fantasy', 'webtoon', 178, false,
   12400000, 521000, 9.7, 108000,
   'Fans of tower climbing and survival games', 'Epic, Brutal, Strategic', 'Mature',
   ARRAY['fantasy', 'tower', 'survival', 'game']),

  ('Forgotten Gods', '잊혀진 신들', 'Ancient gods live among modern humans',
   'Forgotten gods hide in plain sight in Seoul, working mundane jobs while planning their return to power.',
   'Even gods can be forgotten',
   'Yoo Sun-mi', 'Fantasy', 'webtoon', 105, false,
   6400000, 234000, 9.1, 61000,
   'Fans of mythology and modern fantasy', 'Philosophical, Unique, Thought-provoking', 'Adult',
   ARRAY['fantasy', 'gods', 'mythology', 'modern']),

  ('Phoenix Rising', '불사조의 부활', 'Warrior reincarnates to save the kingdom',
   'A legendary warrior reincarnates 500 years later to stop the evil he failed to defeat in his past life.',
   'Death is not the end',
   'Lee Hyun-woo', 'Fantasy', 'novel', 145, true,
   5100000, 187000, 8.9, 49000,
   'Fans of reincarnation and redemption stories', 'Epic, Heroic, Redemptive', 'Adult',
   ARRAY['fantasy', 'reincarnation', 'warrior', 'epic']),

  ('Silver Moon Chronicles', '은월록', 'Werewolf pack navigates modern Seoul',
   'A werewolf pack tries to maintain their secret while navigating modern life and ancient rivalries.',
   'Under the silver moon, we run',
   'Kang Min-ji', 'Fantasy', 'webtoon', 112, false,
   7200000, 276000, 9.2, 68000,
   'Fans of werewolf stories and pack dynamics', 'Primal, Intense, Emotional', 'Mature',
   ARRAY['fantasy', 'werewolves', 'modern', 'pack']),

  ('Witch''s Brew Cafe', '마녀의 카페', 'Witch runs cafe that grants wishes',
   'A witch opens a mysterious cafe where each drink grants a wish, but every wish has a price.',
   'Every cup tells a story',
   'Oh Soo-jin', 'Fantasy', 'webtoon', 87, false,
   4800000, 165000, 8.8, 46000,
   'Fans of cozy fantasy and wish-granting stories', 'Cozy, Magical, Bittersweet', 'Young Adult',
   ARRAY['fantasy', 'witch', 'cafe', 'wishes']),

  ('Demon King''s Daughter', '마왕의 딸', 'Half-demon girl hides her identity',
   'The Demon King''s daughter lives as a human, hiding her powers until darkness forces her to choose a side.',
   'Half human, half demon, all heart',
   'Park Hye-won', 'Fantasy', 'webtoon', 124, false,
   8600000, 325000, 9.3, 78000,
   'Fans of demon stories and identity struggles', 'Dark, Emotional, Action-packed', 'Young Adult',
   ARRAY['fantasy', 'demon', 'identity', 'action']);

-- Slice of Life / Drama (10 titles)
INSERT INTO titles (
  title_name_en, title_name_kr, description, synopsis, tagline,
  author, genre, content_format, chapters, completed,
  views, likes, rating, rating_count,
  perfect_for, tone, audience, tags
) VALUES
  ('Daily Bread Bakery', '매일의 빵', 'Baker finds healing through bread making',
   'A burned-out office worker quits her job to open a small bakery and rediscovers the joy of simple things.',
   'Every loaf is a fresh start',
   'Kim Soo-yeon', 'Slice of Life', 'webtoon', 95, true,
   4200000, 158000, 9.3, 45000,
   'Fans of healing stories and food manga', 'Warm, Comforting, Healing', 'Adult',
   ARRAY['slice-of-life', 'food', 'healing', 'bakery']),

  ('Third Floor', '3층', 'Stories of apartment residents',
   'Interconnected stories of people living in the same apartment building, finding community and connection.',
   'Every door has a story',
   'Lee Ji-hoon', 'Drama', 'webtoon', 108, false,
   3800000, 142000, 8.9, 38000,
   'Fans of ensemble stories and community tales', 'Realistic, Heartwarming, Thoughtful', 'Adult',
   ARRAY['drama', 'slice-of-life', 'community', 'ensemble']),

  ('Midnight Diner Seoul', '서울 심야식당', 'Late-night restaurant serves life lessons',
   'A chef who only opens his diner from midnight to 7am serves food and wisdom to night owls.',
   'Open from midnight to dawn',
   'Jung Woo-jin', 'Slice of Life', 'webtoon', 156, true,
   6100000, 224000, 9.4, 58000,
   'Fans of episodic stories and food culture', 'Warm, Philosophical, Comforting', 'Adult',
   ARRAY['slice-of-life', 'food', 'episodic', 'diner']),

  ('Bookstore at the End', '끝에 있는 서점', 'Mysterious bookstore appears to those in need',
   'A magical bookstore appears only to people at crossroads in their lives, offering the perfect book.',
   'The right book finds you',
   'Shin Da-eun', 'Drama', 'webtoon', 82, false,
   3500000, 128000, 9.1, 35000,
   'Fans of magical realism and book lovers', 'Magical, Thoughtful, Inspiring', 'All Ages',
   ARRAY['drama', 'magical-realism', 'books', 'healing']),

  ('Single Dad Diaries', '싱글대디 일기', 'Single father navigates parenting',
   'A widowed father raises his daughter while trying to rebuild his life and find love again.',
   'Love is patient, love is kind',
   'Park Jun-seo', 'Drama', 'webtoon', 118, false,
   5200000, 189000, 9.2, 52000,
   'Fans of family drama and single parent stories', 'Heartwarming, Realistic, Emotional', 'Adult',
   ARRAY['drama', 'family', 'parenting', 'single-parent']),

  ('Garden of Words', '말의 정원', 'Teacher and student meet in a garden',
   'A high school student and a mysterious woman meet in a garden on rainy mornings, changing each other''s lives.',
   'In the garden, words blossom',
   'Kim Yeon-hee', 'Drama', 'webtoon', 45, true,
   2800000, 98000, 8.8, 28000,
   'Fans of contemplative stories and age-gap tales', 'Poetic, Melancholic, Beautiful', 'Mature',
   ARRAY['drama', 'age-gap', 'nature', 'contemplative']),

  ('Seoul Strangers', '서울의 낯선 사람들', 'Young people navigate life in Seoul',
   'Five twenty-somethings share a house in Seoul, dealing with jobs, relationships, and dreams.',
   'Growing up is growing together',
   'Choi Min-ah', 'Slice of Life', 'webtoon', 132, false,
   6800000, 245000, 9.0, 65000,
   'Fans of coming-of-age and roommate stories', 'Relatable, Funny, Emotional', 'Young Adult',
   ARRAY['slice-of-life', 'coming-of-age', 'roommates', 'twenties']),

  ('Piano Tuner''s Son', '조율사의 아들', 'Boy inherits father''s piano tuning business',
   'A teenager who struggles with music inherits his father''s piano tuning shop and discovers hidden talents.',
   'Every piano has a voice',
   'Nam Joo-hyun', 'Drama', 'webtoon', 76, true,
   3100000, 112000, 8.7, 31000,
   'Fans of music stories and legacy tales', 'Quiet, Introspective, Touching', 'All Ages',
   ARRAY['drama', 'music', 'legacy', 'family']),

  ('Coffee Shop Chronicles', '커피숍 연대기', 'Barista documents customer stories',
   'A writer-turned-barista secretly writes stories inspired by the regulars at her coffee shop.',
   'Every customer has a story',
   'Yoon Ha-ri', 'Slice of Life', 'webtoon', 94, false,
   4600000, 168000, 8.9, 46000,
   'Fans of episodic stories and coffee culture', 'Observant, Warm, Insightful', 'Adult',
   ARRAY['slice-of-life', 'coffee', 'episodic', 'writer']),

  ('Last Train Home', '마지막 전철', 'Stories of last train passengers',
   'Each episode follows different passengers on the last train, revealing their struggles and hopes.',
   'The journey doesn''t end here',
   'Lee Sang-mi', 'Drama', 'webtoon', 65, true,
   2900000, 104000, 8.8, 29000,
   'Fans of anthology stories and public transport tales', 'Reflective, Bittersweet, Real', 'Adult',
   ARRAY['drama', 'anthology', 'public-transport', 'episodic']);

-- Mystery / Horror (10 titles)
INSERT INTO titles (
  title_name_en, title_name_kr, description, synopsis, tagline,
  author, genre, content_format, chapters, completed,
  views, likes, rating, rating_count,
  perfect_for, tone, audience, tags
) VALUES
  ('The Apartment', '그 아파트', 'Residents vanish from cursed apartment',
   'People who move into apartment 404 start disappearing one by one, and no one remembers they existed.',
   'Once you enter, you''re forgotten',
   'Kang Min-seo', 'Horror', 'webtoon', 88, false,
   5800000, 198000, 9.1, 56000,
   'Fans of psychological horror and urban legends', 'Creepy, Psychological, Disturbing', 'Mature',
   ARRAY['horror', 'psychological', 'apartment', 'mystery']),

  ('Detective Kim''s Case Files', '김형사 사건파일', 'Veteran detective solves cold cases',
   'A detective with a photographic memory reopens cold cases using his unique ability to see details others miss.',
   'No case is ever truly cold',
   'Park Tae-won', 'Mystery', 'webtoon', 124, false,
   6400000, 234000, 9.3, 64000,
   'Fans of detective stories and procedurals', 'Smart, Methodical, Engaging', 'Adult',
   ARRAY['mystery', 'detective', 'crime', 'procedural']),

  ('Whispers in the Dark', '어둠 속의 속삭임', 'Psychiatrist treats patients with dark secrets',
   'A psychiatrist discovers her patients'' nightmares are connected to a sinister conspiracy.',
   'Every nightmare hides a truth',
   'Jung Hae-jin', 'Horror', 'webtoon', 98, false,
   4900000, 172000, 8.9, 48000,
   'Fans of psychological horror and medical mysteries', 'Dark, Psychological, Twisty', 'Mature',
   ARRAY['horror', 'psychological', 'psychiatrist', 'conspiracy']),

  ('The Dollmaker', '인형 제작자', 'Antique dolls harbor dark secrets',
   'A collector of antique dolls discovers each one contains the soul of a murder victim.',
   'Every doll has a story to tell',
   'Shin Yu-na', 'Horror', 'webtoon', 72, true,
   3600000, 128000, 8.7, 36000,
   'Fans of supernatural horror and creepy objects', 'Eerie, Supernatural, Dark', 'Mature',
   ARRAY['horror', 'dolls', 'supernatural', 'murder']),

  ('Forgotten Village', '잊혀진 마을', 'Journalist investigates disappeared village',
   'A journalist travels to a village that was erased from all maps to uncover what really happened.',
   'Some places want to stay hidden',
   'Kim Sung-ho', 'Mystery', 'webtoon', 104, true,
   5200000, 189000, 9.0, 52000,
   'Fans of conspiracy mysteries and isolated settings', 'Mysterious, Atmospheric, Tense', 'Mature',
   ARRAY['mystery', 'conspiracy', 'village', 'investigation']),

  ('Mirror Mirror', '거울 거울', 'Mirrors show alternate reality',
   'A woman discovers mirrors in her new house show a parallel world where everyone has dark secrets.',
   'What you see isn''t what it seems',
   'Oh Min-jung', 'Horror', 'webtoon', 86, false,
   4400000, 156000, 8.8, 44000,
   'Fans of supernatural horror and parallel worlds', 'Unsettling, Surreal, Creepy', 'Mature',
   ARRAY['horror', 'mirrors', 'parallel-world', 'supernatural']),

  ('The Pharmacy', '그 약국', 'Pharmacist discovers dangerous prescription',
   'A pharmacist notices a pattern in prescriptions that points to a serial killer hiding among patients.',
   'Death comes with a prescription',
   'Lee Jae-sung', 'Thriller', 'webtoon', 94, false,
   3900000, 142000, 8.9, 39000,
   'Fans of medical thrillers and serial killer stories', 'Tense, Medical, Dark', 'Mature',
   ARRAY['thriller', 'medical', 'serial-killer', 'mystery']),

  ('Room 13', '13호실', 'Hotel room that shouldn''t exist',
   'A hotel claims to have no 13th floor, but guests keep finding Room 13 and checking out changed.',
   'Some rooms should stay empty',
   'Yoon Se-na', 'Horror', 'webtoon', 68, true,
   3200000, 114000, 8.6, 32000,
   'Fans of hotel horror and cursed places', 'Eerie, Mysterious, Atmospheric', 'Mature',
   ARRAY['horror', 'hotel', 'cursed-place', 'supernatural']),

  ('The Profiler', '프로파일러', 'Criminal profiler hunts mastermind',
   'A brilliant profiler is drawn into a cat-and-mouse game with a criminal who knows her every move.',
   'To catch a killer, think like one',
   'Park Ji-hwan', 'Thriller', 'webtoon', 118, false,
   6800000, 254000, 9.2, 68000,
   'Fans of psychological thrillers and cat-and-mouse games', 'Intense, Psychological, Smart', 'Mature',
   ARRAY['thriller', 'profiler', 'psychological', 'cat-and-mouse']),

  ('Blackout', '정전', 'City-wide blackout reveals hidden horrors',
   'During a mysterious blackout in Seoul, people discover that something sinister emerges in the darkness.',
   'In the darkness, it awakens',
   'Choi Dong-wook', 'Horror', 'webtoon', 52, false,
   2800000, 98000, 8.5, 28000,
   'Fans of apocalyptic horror and survival', 'Dark, Scary, Survival', 'Mature',
   ARRAY['horror', 'apocalyptic', 'darkness', 'survival']);

-- ============================================================
-- SECTION 3: Test Subscriptions (Stripe)
-- ============================================================

-- Note: We don't directly insert into Stripe-managed tables
-- These would be created through webhook events in real scenarios
-- This section documents the test subscription data structure

-- Test Pro Subscription (for test-buyer-pro@testcompany.com)
-- stripe_customer_id: cus_test_pro_001
-- stripe_subscription_id: sub_test_pro_001
-- status: active
-- current_period_start: now()
-- current_period_end: now() + interval '1 month'

-- Test Suite Subscription (for test-buyer-suite@testcompany.com)
-- stripe_customer_id: cus_test_suite_001
-- stripe_subscription_id: sub_test_suite_001
-- status: active
-- current_period_start: now()
-- current_period_end: now() + interval '1 month'

-- ============================================================
-- SECTION 4: Test Chat Sessions & Messages
-- ============================================================

-- Create test chat sessions for pro buyer
INSERT INTO chat_sessions (user_email, session_type, started_at, ended_at)
VALUES
  ('test-buyer-pro@testcompany.com', 'openai', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('test-buyer-pro@testcompany.com', 'openai', NOW() - INTERVAL '1 day', NULL),
  ('test-buyer-suite@testcompany.com', 'openai', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Get the session IDs (this would be done programmatically in real scenario)
-- For seed purposes, we'll assume session IDs 1, 2, 3

-- Sample chat messages for session 1 (completed session)
INSERT INTO chat_messages (session_id, user_email, role, content, created_at)
VALUES
  (1, 'test-buyer-pro@testcompany.com', 'user', 'Tell me about romantic webtoons with strong female leads', NOW() - INTERVAL '2 days'),
  (1, 'test-buyer-pro@testcompany.com', 'assistant', 'Here are some great romantic webtoons featuring strong female protagonists:\n\n1. **Love in Seoul** - A marketing executive who holds her own in the corporate world\n2. **Royal Heartbeat** - A university student who saves a prince and navigates royal politics\n3. **Red Phoenix** - An undercover spy who infiltrates criminal organizations', NOW() - INTERVAL '2 days' + INTERVAL '3 seconds'),
  (1, 'test-buyer-pro@testcompany.com', 'user', 'Tell me more about Love in Seoul', NOW() - INTERVAL '2 days' + INTERVAL '1 minute'),
  (1, 'test-buyer-pro@testcompany.com', 'assistant', 'Love in Seoul is a romantic comedy that follows two marketing executives competing for the same promotion. The female lead is ambitious, smart, and doesn''t back down from challenges. With 5M+ views and a 9.2 rating, it''s perfect for fans of workplace romance and enemies-to-lovers dynamics.', NOW() - INTERVAL '2 days' + INTERVAL '1 minute' + INTERVAL '4 seconds');

-- Sample chat messages for session 2 (ongoing)
INSERT INTO chat_messages (session_id, user_email, role, content, created_at)
VALUES
  (2, 'test-buyer-pro@testcompany.com', 'user', 'What fantasy titles have high view counts?', NOW() - INTERVAL '1 day'),
  (2, 'test-buyer-pro@testcompany.com', 'assistant', 'Here are the top fantasy titles by view count:\n\n1. **Tower of Trials** - 12.4M views, brutal survival tower climbing\n2. **Moonlight Academy** - 10.5M views, magical school setting\n3. **The Last Mage** - 9.2M views, urban fantasy with chosen one theme\n\nAll three have ratings above 9.5 and strong fan engagement.', NOW() - INTERVAL '1 day' + INTERVAL '5 seconds');

-- ============================================================
-- VERIFICATION QUERIES (Comment out before running)
-- ============================================================

-- Uncomment these to verify seed data after running:

-- SELECT COUNT(*) as buyer_count FROM user_buyers;
-- SELECT COUNT(*) as creator_count FROM user_creators;
-- SELECT COUNT(*) as title_count FROM titles;
-- SELECT COUNT(*) as session_count FROM chat_sessions;
-- SELECT COUNT(*) as message_count FROM chat_messages;

-- SELECT tier, COUNT(*) as count FROM user_buyers GROUP BY tier;
-- SELECT genre, COUNT(*) as count FROM titles GROUP BY genre;

-- ============================================================
-- END OF SEED FILE
-- ============================================================
