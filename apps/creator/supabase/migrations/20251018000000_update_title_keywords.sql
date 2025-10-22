-- Migration: Update title keywords from Excel import
-- Generated: 2025-10-18T18:38:40.573Z
-- Source: query.xlsx
-- Updates: 127 titles

BEGIN;

UPDATE titles
SET keywords = ARRAY['Best Friends/ Friends First', 'Childhood Friends', 'Coming of Age', 'Contemporary', 'Female Lead', 'First Love', 'Forbidden Love', 'Forbidden Student', 'Forbidden Teacher', 'Friends to Lovers', 'Friendship', 'Girl Next Door', 'Healing from Trauma', 'Hidden Relationship', 'High School Romance', 'Love at First Sight', 'Love Triangle', 'Love/Hate', 'Modern Era', 'Relationships', 'Rivals/ Protagonist vs. Antagonist', 'Romance', 'Scandalous Affair', 'School', 'Secret Relationship', 'Small Town', 'Sorry I''m Taken', 'Summer Fling', 'Sweethearts Forever?', 'Teacher and Student (Age-Appropriate Version)', 'Teenagers', 'Tragic Past', 'Trauma', 'Unrequited Love', 'Unspoken Feelings', 'YA', 'Young Adult', 'Orphan'],
    updated_at = now()
WHERE title_name_kr = '재밌니, 짝사랑';

UPDATE titles
SET keywords = ARRAY['Action Adventure', 'Adventurer', 'Adventurer', 'Coming of Age', 'Contemporary', 'India', 'Lighthearted', 'Lore', 'Magic', 'Martial Arts', 'Modern Era', 'Mythology', 'Powers', 'School', 'Shonen', 'Superhero', 'Teenagers', 'YA'],
    updated_at = now()
WHERE title_name_kr = '후드';

UPDATE titles
SET keywords = ARRAY['Romance', 'Contemporary', 'Love Triangle', 'Second Chance Romance', 'Workplace Romance', 'Coworkers to Lovers', 'Reunion', 'Forbidden Love', 'Rivals in Love', 'Emotional', 'Angsty'],
    updated_at = now()
WHERE title_name_kr = '전 여친';

UPDATE titles
SET keywords = ARRAY['Time Travel', 'Second Chance Romance', 'Contemporary', 'Female Lead', 'Coming of Age', 'Romance', 'Romantic Drama', 'Dreams', 'Young Adult', 'School', 'Teenagers', 'Healing', 'Self-Discovery', 'Redemption', 'Hope', 'Emotional'],
    updated_at = now()
WHERE title_name_kr = '드리밍';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Modern Era', 'Supernatural', 'Technology', 'Transformation', 'School', 'Teenagers', 'Coming of Age', 'Addiction', 'Mental Health', 'Weird', 'BIPOC', 'Slice of Life', 'Character-Driven', 'Quirky', 'Young Adult'],
    updated_at = now()
WHERE title_name_kr = '스마트폰 중독자';

UPDATE titles
SET keywords = ARRAY['Superhero', 'Reincarnation', 'Action Adventure', 'Powers', 'Rebirth', 'Transformation', 'Modern Era', 'Destiny', 'Identity', 'Redemption', 'Coming of Age'],
    updated_at = now()
WHERE title_name_kr = '영웅 강철남';

UPDATE titles
SET keywords = ARRAY['1980s', '1990s', 'Pop Culture', 'Alternate Reality', 'Retro', 'Supernatural', 'Mystery', 'Contemporary', 'Action Adventure', 'Americana'],
    updated_at = now()
WHERE title_name_kr = '도대체 왜?인구단';

UPDATE titles
SET keywords = ARRAY['Body Modification', 'Bullying', 'Coming of Age', 'Female Lead', 'High School Romance', 'Identity', 'Japan', 'Mystery', 'Rebirth', 'School', 'Secret Identity', 'Self-Discovery', 'Supernatural', 'Teenagers', 'Transformation', 'Young Adult'],
    updated_at = now()
WHERE title_name_kr = '나비인간';

UPDATE titles
SET keywords = ARRAY['School', 'Bullying', 'Romance', 'Coming of Age', 'Contemporary', 'Enemies to Lovers', 'High School Romance', 'Secret Relationship', 'Forbidden Love', 'Popular Girl', 'Love Triangle', 'Protective Hero', 'Healing Love', 'Hidden Relationship', 'Redemption'],
    updated_at = now()
WHERE title_name_kr = '날라리';

UPDATE titles
SET keywords = ARRAY['Supernatural', 'Romance', 'Reincarnation', 'School', 'Contemporary', 'Guardian Spirit', 'Fated Mates', 'Protective Love', 'Supernatural Romance', 'Paranormal Romance', 'Destined Connection', 'Past Lives', 'Forbidden Love', 'Immortal and Mortal', 'Enemies to Lovers', 'Healing from Trauma', 'Mystery'],
    updated_at = now()
WHERE title_name_kr = '우주를 9번 건너';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Romance', 'Celebrity Romance', 'Secret Identity', 'Fake Relationship', 'Virtual Reality', 'Reality Show Romance', 'LGBTQIA+', 'MM Romance', 'Music', 'Online Romance', 'Romantic Comedy'],
    updated_at = now()
WHERE title_name_kr = '운영자의 권한으로';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'High School Romance', 'Teenagers', 'School', 'Supernatural', 'Creatures', 'Slice of Life', 'Heartwarming', 'Feel-Good', 'Friendship', 'Coming of Age', 'Modern Era', 'Cozy', 'Wholesome', 'Character-Driven', 'Sweet Romance', 'Clean Romance'],
    updated_at = now()
WHERE title_name_kr = '고양이 뚜껑';

UPDATE titles
SET keywords = ARRAY['School', 'Coming of Age', 'Friendship', 'Crime', 'Class Divide', 'Justice', 'Revenge', 'Politics', 'Contemporary', 'BIPOC', 'Teenagers', 'Partners in Crime', 'Different Worlds', 'Rebellion'],
    updated_at = now()
WHERE title_name_kr = '주작학원';

UPDATE titles
SET keywords = ARRAY['MM Romance', 'Contemporary', 'Mountain', 'Cabin in the Woods', 'Survival Romance', 'Snowstorm Stranded Together', 'Forced Proximity', 'Trapped Together', 'Love at First Sight', 'Mental Health', 'Rescue Romance', 'Healing Love', 'Trauma', 'Intense', 'Emotional', 'Dark', 'Brooding', 'Slow Burn', 'Angsty'],
    updated_at = now()
WHERE title_name_kr = '겨우내';

UPDATE titles
SET keywords = ARRAY['Aliens', 'Family', 'Coming of Age', 'Contemporary', 'Female Lead', 'Teenagers', 'Space', 'Identity', 'Belonging', 'Cultural Clash', 'Different Worlds', 'Immigrant Experience', 'Secret Identity', 'Slice of Life', 'Character-Driven'],
    updated_at = now()
WHERE title_name_kr = '무능한 아빠는 외계인';

UPDATE titles
SET keywords = ARRAY['Coming of Age', 'Superhero', 'Action Adventure', 'Parody', 'Zany', 'Quirky', 'Funny', 'Lighthearted', 'Martial Arts', 'Powers', 'Quest', 'Redemption', 'Self-Discovery', 'Shonen'],
    updated_at = now()
WHERE title_name_kr = '우당탕탕 따식이';

UPDATE titles
SET keywords = ARRAY['Female Lead', 'Coming of Age', 'Self-Discovery', 'Contemporary', 'Slice of Life', 'Road Trip', 'Transformation', 'Empowerment', 'Independence', 'Growth', 'Character-Driven', 'Inspirational', 'Uplifting', 'Feel-Good', 'Heartwarming'],
    updated_at = now()
WHERE title_name_kr = '날 만나러 가요';

UPDATE titles
SET keywords = ARRAY['Romance', 'Contemporary', 'College', 'LGBTQIA+', 'FF Romance', 'Enemies to Lovers', 'Opposites Attract', 'Grumpy Sunshine', 'Art', 'Workplace Romance', 'Second Chance Romance', 'Slow Burn', 'Character-Driven', 'Emotional', 'Coming of Age'],
    updated_at = now()
WHERE title_name_kr = '텍미하이(Take me high)';

UPDATE titles
SET keywords = ARRAY['Romance', 'Slice of Life', 'Contemporary', 'Creatures', 'Heartwarming', 'Sweet Romance', 'Romantic Comedy', 'Feel-Good', 'Wholesome', 'Cozy', 'Character-Driven', 'Relatable', 'Bittersweet'],
    updated_at = now()
WHERE title_name_kr = '네임펜으로 그린 그림';

UPDATE titles
SET keywords = ARRAY['Romance', 'Contemporary', 'Modern Era', 'Marriage in Crisis', 'Second Chance Romance', 'Workplace Romance', 'Doctor', 'Passionate Lovers', 'Healing', 'Redemption', 'Reconciliation', 'Emotional', 'Steamy'],
    updated_at = now()
WHERE title_name_kr = '전처와의 동거';

UPDATE titles
SET keywords = ARRAY['Romance', 'Contemporary', 'College', 'Roommates to Lovers', 'Enemies to Lovers', 'Forced Proximity', 'Only One Bed', 'Cultural Clash', 'Slow Burn', 'Coming of Age', 'New Adult', 'Romantic Comedy', 'Feel-Good', 'Heartwarming'],
    updated_at = now()
WHERE title_name_kr = '사랑에 번역앱이 필요한가요?';

UPDATE titles
SET keywords = ARRAY['Romance', 'Contemporary', 'Age Gap', 'Arranged Marriage', 'Forced Proximity', 'Marriage of Convenience', 'Family', 'Billionaire Romance', 'Opposites Attract', 'Enemies to Lovers', 'Dramatic', 'Angsty', 'Female Lead', 'Redemption', 'Rebellion', 'Emotional', 'Modern Era'],
    updated_at = now()
WHERE title_name_kr = '나쁘니까 더';

UPDATE titles
SET keywords = ARRAY['Post-Apocalyptic', 'Apocalyptic', 'Survival', 'Coming of Age', 'Monsters', 'Teenagers', 'Young Adult', 'Trauma', 'Redemption', 'Sacrifice', 'Hope', 'Courage', 'Found Family', 'Action Adventure', 'Dark', 'Intense', 'Character-Driven'],
    updated_at = now()
WHERE title_name_kr = '죽은 자를 상대하는 방법';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Social Media', 'BIPOC', 'Female Lead', 'Teenagers', 'High School Romance', 'Secret Identity', 'Trauma', 'Family', 'Coming of Age', 'Identity', 'Self-Discovery', 'Grief', 'Loss', 'Healing', 'Double Cross', 'Slice of Life', 'Character-Driven'],
    updated_at = now()
WHERE title_name_kr = '그림자 미녀';

UPDATE titles
SET keywords = ARRAY['MM Romance', 'Revenge', 'LGBTQIA+', 'Contemporary', 'Enemies to Lovers', 'Forbidden Love', 'Trauma', 'Dark', 'Angsty', 'Emotional', 'Protective Love', 'Healing from Trauma', 'Secret Identity', 'Dangerous Drama', 'Passionate', 'Intense'],
    updated_at = now()
WHERE title_name_kr = '영의 확률';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Social Media', 'Psychological Romance', 'Influencer Romance', 'Secrets', 'Lies', 'Identity', 'Obsession', 'Celebrity and Fan', 'Dark', 'Intense', 'Suspenseful', 'Modern Era', 'LGBTQIA+', 'Female Lead'],
    updated_at = now()
WHERE title_name_kr = '인간시장';

UPDATE titles
SET keywords = ARRAY['Slice of Life', 'Contemporary', 'Lighthearted', 'Funny', 'Quirky', 'Feel-Good', 'Relatable', 'Character-Driven', 'Modern Era', 'Self-Discovery', 'Growth'],
    updated_at = now()
WHERE title_name_kr = '웽툰 시즌5';

UPDATE titles
SET keywords = ARRAY['Historical Fantasy', 'Romance', 'Supernatural', 'Female Lead', 'Creatures', 'Opposites Attract', 'Enemies to Lovers', 'Contract Relationship', 'Survival'],
    updated_at = now()
WHERE title_name_kr = '조선팔도 최강아이돌';

UPDATE titles
SET keywords = ARRAY['Demons', 'Supernatural', 'Romance', 'Dreams', 'Magic', 'Enemies to Lovers', 'Contract Relationship', 'Supernatural Romance', 'Paranormal Romance', 'Fantasy Romance', 'Demon Romance', 'School', 'Romantic Comedy', 'Funny', 'Quirky', 'Playful', 'Slow Burn', 'Tsundere Uke'],
    updated_at = now()
WHERE title_name_kr = '애증과 애정사이';

UPDATE titles
SET keywords = ARRAY['Romance', 'Romantic Comedy', 'Steamy', 'Explicit', 'Open Door', 'Funny', 'Playful', 'Quirky', 'Lighthearted', 'Feel-Good', 'Fast-Paced', 'Contemporary', 'Modern Era', 'Slice of Life', 'Character-Driven', 'High-Heat', 'Sensual', 'Flirty', 'Sexy'],
    updated_at = now()
WHERE title_name_kr = '멜랑꼴리';

UPDATE titles
SET keywords = ARRAY['Supernatural', 'Powers', 'Romance', 'Cafe/Restaurant Romance', 'Tragic Past', 'Trauma', 'Workplace Romance', 'Forbidden Love', 'Melancholy', 'Bittersweet', 'Emotional', 'Contemporary', 'Slow Burn', 'Reluctant Lovers', 'Healing', 'Redemption'],
    updated_at = now()
WHERE title_name_kr = '페이트';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'College', 'Secret Identity', 'Double Cross', 'Social Media', 'Psychological Romance', 'Dark', 'Angsty', 'Forbidden Love', 'Secrets', 'Lies', 'Identity', 'Transformation', 'Female Lead', 'Dangerous Drama', 'Tortured Hero', 'Captive Falls for Captor', 'Modern Era', 'Trauma'],
    updated_at = now()
WHERE title_name_kr = '다 해줄게';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Female Lead', 'Business', 'Family', 'Trauma', 'Coming of Age', 'Corporations', 'Relationships', 'Modern Era', 'Character-Driven', 'Redemption', 'Self-Discovery', 'Transformation', 'Class Divide', 'Betrayal', 'Healing', 'Empowerment', 'Independence'],
    updated_at = now()
WHERE title_name_kr = '얼굴미화부';

UPDATE titles
SET keywords = ARRAY['Mystery', 'Family', 'Small Town', 'Secrets', 'Coming of Age', 'Contemporary', 'Village'],
    updated_at = now()
WHERE title_name_kr = '백합 하우스';

UPDATE titles
SET keywords = ARRAY['Alternate Reality', 'Contemporary', 'Urban Fantasy', 'Music', 'Pop Culture', 'Transformation', 'Identity', 'Modern Era'],
    updated_at = now()
WHERE title_name_kr = '대형막내!';

UPDATE titles
SET keywords = ARRAY['Supernatural', 'Body Swapping', 'Mystery', 'Psychological Romance', 'Dark Fantasy', 'Transformation', 'Cursed Love', 'Identity Swap', 'Mistaken Identity', 'Tragic', 'Suspenseful', 'Dark', 'Moody', 'Intense', 'Contemporary', 'Forbidden Love', 'Magic'],
    updated_at = now()
WHERE title_name_kr = '나를 바꿔줘';

UPDATE titles
SET keywords = ARRAY['Demons', 'Powers', 'Supernatural', 'Apocalyptic', 'Cosmic'],
    updated_at = now()
WHERE title_name_kr = '사기캐';

UPDATE titles
SET keywords = ARRAY['Demons', 'Supernatural', 'Dark Fantasy', 'Family Saga', 'Historical', 'Occult', 'Apocalyptic', 'Dark', 'Atmospheric'],
    updated_at = now()
WHERE title_name_kr = '데모니악';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Romance', 'Monsters', 'Demons', 'Supernatural', 'LGBTQIA+', 'Relationships', 'Transformation', 'Class Divide', 'Opposites Attract', 'Forbidden Love', 'Dramatic', 'Angsty', 'Character-Driven'],
    updated_at = now()
WHERE title_name_kr = 'Day Or Night';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Grief', 'Loss', 'Trauma', 'Mental Health', 'Healing', 'Self-Discovery', 'Emotional', 'Tearjerker', 'Character-Driven', 'Female Lead', 'Redemption', 'Hope', 'Angsty', 'Dramatic', 'Poignant', 'Cathartic', 'Bittersweet'],
    updated_at = now()
WHERE title_name_kr = '그녀의 버킷리스트';

UPDATE titles
SET keywords = ARRAY['Family', 'Slice of Life', 'Lighthearted', 'Funny', 'Quirky', 'Feel-Good', 'Heartwarming', 'Contemporary', 'Zany', 'Parody', 'Pop Culture', 'Relatable', 'Witty'],
    updated_at = now()
WHERE title_name_kr = '스마트 패밀리';

UPDATE titles
SET keywords = ARRAY['Near Future', 'Aliens', 'Supernatural', 'Powers', 'High School Romance', 'Teenagers', 'Science', 'Space', 'Apocalyptic', 'Mental Health', 'Trauma', 'Coming of Age', 'Sci-Fi Romance', 'Paranormal Romance', 'Protective Love', 'Healing from Trauma', 'Secret Identity', 'Hidden Powers', 'Enemies to Lovers'],
    updated_at = now()
WHERE title_name_kr = '베텔게우스';

UPDATE titles
SET keywords = ARRAY['Witches', 'Magic', 'Romance', 'Contemporary', 'Supernatural Romance', 'Urban Fantasy', 'Female Lead', 'First Love', 'Love Triangle', 'Workplace Romance', 'CEO', 'Forbidden Love', 'Redemption', 'Romantic Fantasy'],
    updated_at = now()
WHERE title_name_kr = '마녀는 사랑하지 않아도 괜찮아요';

UPDATE titles
SET keywords = ARRAY['Ghosts', 'Romance', 'Supernatural', 'Supernatural Romance', 'Paranormal Romance', 'Second Chance Romance', 'Redemption', 'Contemporary', 'Romantic Comedy', 'Afterlife'],
    updated_at = now()
WHERE title_name_kr = '귀신과 연애하기 시뮬레이션';

UPDATE titles
SET keywords = ARRAY['MM Romance', 'Body Swapping', 'Childhood Friends', 'College Romance', 'Supernatural Romance', 'Reunion', 'Trauma', 'LGBTQIA+', 'Contemporary', 'Friendship', 'Coming of Age', 'Relationships', 'Emotional', 'Angsty', 'Heartwarming', 'Second Chance Romance', 'Supernatural', 'Powers', 'Young Adult'],
    updated_at = now()
WHERE title_name_kr = 'Luck 4 you';

UPDATE titles
SET keywords = ARRAY['School', 'Slasher', 'Murder', 'Mystery', 'Bullying', 'Revenge', 'Survival', 'Trauma', 'Female Lead', 'Teenagers', 'Trapped Together'],
    updated_at = now()
WHERE title_name_kr = '토끼는 숨죽여 울고 있었다';

UPDATE titles
SET keywords = ARRAY['Parody', 'Zany', 'Trauma', 'Weird'],
    updated_at = now()
WHERE title_name_kr = '트라우마';

UPDATE titles
SET keywords = ARRAY['MM Romance', 'LGBTQIA+', 'Contemporary', 'Friends to Lovers', 'High School Romance', 'Second Chance Romance', 'Childhood Friends', 'Dreams', 'Coming of Age', 'Slow Burn', 'Angsty', 'Emotional', 'Reunion', 'Past Lives', 'Romantic Drama', 'Young Adult'],
    updated_at = now()
WHERE title_name_kr = '네버마인드달링';

UPDATE titles
SET keywords = ARRAY['Family', 'Coming of Age', 'Contemporary', 'Slice of Life', 'Heartwarming', 'Feel-Good', 'Character-Driven', 'Relatable', 'Down-to-Earth'],
    updated_at = now()
WHERE title_name_kr = '희망횟집';

UPDATE titles
SET keywords = ARRAY['Romance', 'Contemporary', 'Celebrity Romance', 'Idol and Manager', 'Opposites Attract', 'Modern Era', 'Workplace Romance', 'Slow Burn', 'Pop Culture', 'Social Media', 'Celebrity and Fan'],
    updated_at = now()
WHERE title_name_kr = '이로운 변태';

UPDATE titles
SET keywords = ARRAY['Slice of Life', 'Contemporary', 'Lighthearted', 'Funny', 'Quirky', 'Feel-Good', 'Relatable', 'Modern', 'Parody', 'Zany', 'Pop Culture', 'Character-Driven'],
    updated_at = now()
WHERE title_name_kr = '츄리닝';

UPDATE titles
SET keywords = ARRAY['MM Romance', 'Contemporary', 'Second Chance Romance', 'Childhood Sweethearts', 'Roommates to Lovers', 'LGBTQIA+', 'College', 'Modern Era', 'Reunion', 'First Love', 'Slice of Life', 'Feel-Good', 'Heartwarming', 'Cozy', 'Young Adult'],
    updated_at = now()
WHERE title_name_kr = '홈파이브(HOME5)';

UPDATE titles
SET keywords = ARRAY['LGBTQIA+', 'Female Lead', 'High School Romance', 'Contemporary', 'Teenagers', 'School', 'Coming of Age', 'Romantic Comedy', 'FF Romance', 'Mistaken Identity', 'Queer Identity', 'Zany', 'Funny', 'Quirky', 'Slice of Life', 'Modern Era', 'Self-Discovery'],
    updated_at = now()
WHERE title_name_kr = '봄과 겨울';

UPDATE titles
SET keywords = ARRAY['School', 'Supernatural', 'Demons', 'Religion', 'Occult', 'Bullying', 'Action Adventure', 'Secret Identity', 'Apocalyptic', 'Hidden Powers', 'Young Adult', 'Urban Fantasy', 'Martial Arts'],
    updated_at = now()
WHERE title_name_kr = '겁쟁이 피지컬';

UPDATE titles
SET keywords = ARRAY['Family', 'Slice of Life', 'Contemporary', 'Coming of Age', 'Heartwarming', 'Feel-Good', 'Cozy', 'Character-Driven', 'Found Family', 'Domestic Bliss After Chaos', 'Wholesome'],
    updated_at = now()
WHERE title_name_kr = '웽툰 시즌4';

UPDATE titles
SET keywords = ARRAY['Romance', 'Coming of Age', 'High School Romance', 'Childhood Friends', 'Friends to Lovers', 'Unrequited Love', 'Confession Scene', 'School', 'Teenagers', 'Contemporary', 'Young Adult', 'Slow Burn', 'Emotional', 'Sweet Romance', 'Heartwarming'],
    updated_at = now()
WHERE title_name_kr = '우리는 매일매일';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Family', 'Slice of Life', 'Relatable', 'Single Dad', 'Business', 'Heartwarming', 'Character-Driven', 'Modern Era', 'Workplace Romance', 'Coming of Age', 'Masculinity', 'Fatherhood'],
    updated_at = now()
WHERE title_name_kr = '데이 세이 헤이';

UPDATE titles
SET keywords = ARRAY['Family', 'Mental Health', 'Trauma', 'Healing', 'Contemporary', 'Modern Era', 'Emotional', 'Tearjerker', 'Bittersweet', 'Character-Driven', 'Slice of Life', 'Redemption', 'Self-Discovery', 'Forgiveness'],
    updated_at = now()
WHERE title_name_kr = '아스라이';

UPDATE titles
SET keywords = ARRAY['Werewolves', 'Contemporary', 'Romance', 'Supernatural Romance', 'Paranormal Romance', 'Crime', 'Murder', 'Orphan', 'Protective Love', 'Found Family', 'Transformation', 'Fated Mates', 'Partners in Crime', 'Healing from Trauma'],
    updated_at = now()
WHERE title_name_kr = '루나';

UPDATE titles
SET keywords = ARRAY['Superhero', 'Powers', 'Coming of Age', 'Teenagers', 'Family', 'Government', 'Action Adventure', 'Contemporary', 'Found Family', 'Self-Discovery', 'Redemption', 'Healing', 'Growth', 'Belonging', 'Legacy', 'Duty', 'Identity', 'Overcoming', 'Shonen'],
    updated_at = now()
WHERE title_name_kr = '반투명인간';

UPDATE titles
SET keywords = ARRAY['Romance', 'Body Swapping', 'Supernatural', 'Contemporary', 'Heartwarming', 'Slice of Life', 'Transformation', 'Innocent', 'Sweet Romance', 'Modern Era', 'Healing', 'Quirky', 'Feel-Good', 'Character-Driven', 'Slow Burn', 'Love at First Sight', 'Secret Identity', 'Romantic Comedy'],
    updated_at = now()
WHERE title_name_kr = '내가 누구개';

UPDATE titles
SET keywords = ARRAY['Demons', 'Supernatural', 'Romance', 'Paranormal Romance', 'Contemporary', 'Female Lead', 'Coming of Age', 'Supernatural Romance', 'Contract Relationship', 'College', 'Self-Discovery', 'Forbidden Love'],
    updated_at = now()
WHERE title_name_kr = '악마와 계약연애';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Romance', 'Music', 'Forbidden Love', 'Enemies to Lovers', 'Dark', 'Intense', 'Passionate', 'Alpha Male', 'Musician', 'Workplace Romance', 'Forced Proximity', 'Brooding Hero', 'Grumpy Sunshine', 'Captive Falls for Captor', 'Dangerous Drama'],
    updated_at = now()
WHERE title_name_kr = '애착 인형';

UPDATE titles
SET keywords = ARRAY['High School Romance', 'Supernatural', 'Trauma', 'Healing', 'Mental Health', 'Powers', 'Childhood Friends', 'Secret Crush', 'Unrequited Love', 'Coming of Age', 'Contemporary', 'Slow Burn', 'Emotional', 'Heartwarming', 'Reunion', 'Friends to Lovers'],
    updated_at = now()
WHERE title_name_kr = '꽃에 피는 봄';

UPDATE titles
SET keywords = ARRAY['MM Romance', 'LGBTQIA+', 'Contemporary', 'School', 'Childhood Friends', 'Unrequited Love', 'Secret Crush', 'Coming of Age', 'First Love', 'Body Modification', 'Pining After His Parent', 'Childhood Sweethearts', 'Romance', 'Young Adult', 'Slow Burn', 'Angsty', 'Heartwarming', 'Character-Driven'],
    updated_at = now()
WHERE title_name_kr = '우리 모두는 누군가의 첫사랑이었다';

UPDATE titles
SET keywords = ARRAY['Fantasy Romance', 'Reincarnation', 'Past Lives', 'Dragons', 'Supernatural', 'Mythology', 'Creatures', 'Forbidden Love', 'Different Worlds', 'Eastern Fantasy', 'Fated Mates', 'Opposites Attract', 'Tragic Past', 'Dreams', 'Destined Love'],
    updated_at = now()
WHERE title_name_kr = '밀토담';

UPDATE titles
SET keywords = ARRAY['Mythology', 'Powers', 'Body Modification', 'Magic', 'Supernatural', 'Dark Fantasy', 'Antihero', 'Quest', 'Treasure'],
    updated_at = now()
WHERE title_name_kr = '황금의 핸드메이커';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Modern Era', 'Literature', 'Mystery', 'Secrets', 'Identity', 'Unreliable Narrator', 'Character-Driven', 'Truth', 'Self-Discovery', 'Slice of Life'],
    updated_at = now()
WHERE title_name_kr = '아는 사람 이야기';

UPDATE titles
SET keywords = ARRAY['School', 'Slice of Life', 'Diversity', 'BIPOC', 'Zany', 'Lighthearted', 'Funny', 'Character-Driven', 'Contemporary', 'Relatable'],
    updated_at = now()
WHERE title_name_kr = '웃지 않는 개그반';

UPDATE titles
SET keywords = ARRAY['Historical', 'Political Intrigue', 'Crime', 'Mystery', 'Friendship', 'Coming of Age', 'Government', 'Character-Driven'],
    updated_at = now()
WHERE title_name_kr = '도문대작';

UPDATE titles
SET keywords = ARRAY['High School Romance', 'Teenagers', 'Coming of Age', 'Contemporary', 'Female Lead', 'School', 'Bullying', 'Enemies to Lovers', 'Love at First Sight', 'Neighbors to Lovers', 'Innocent', 'First Love', 'Romance', 'Young Adult'],
    updated_at = now()
WHERE title_name_kr = '러브 앤 위시';

UPDATE titles
SET keywords = ARRAY['Post-Apocalyptic', 'Apocalyptic', 'Monsters', 'Survival', 'King', 'Royalty', 'Dark Fantasy', 'Action Adventure', 'Antihero', 'Transformation', 'Dystopian', 'Monster Boyfriend', 'Creatures', 'Supernatural', 'Rebirth'],
    updated_at = now()
WHERE title_name_kr = '데드라이프';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Romance', 'Second Chance Romance', 'Childhood Friends', 'Reunion', 'Nostalgic', 'Emotional', 'Character-Driven', 'Slow Burn', 'Coming of Age', 'Bittersweet', 'Heartwarming', 'Slice of Life', 'Poignant', 'Healing', 'Redemption'],
    updated_at = now()
WHERE title_name_kr = '끝과 시작';

UPDATE titles
SET keywords = ARRAY['Coming of Age', 'Romance', 'First Love', 'Love Triangle', 'Contemporary', 'Emotional', 'Character-Driven', 'Angsty', 'Young Adult', 'Childhood Sweethearts', 'Self-Discovery', 'Growth', 'Obsession', 'Healing', 'Bittersweet', 'Romantic Drama'],
    updated_at = now()
WHERE title_name_kr = '사랑양장점';

UPDATE titles
SET keywords = ARRAY['Romance', 'Contemporary', 'Childhood Friends', 'Friends to Lovers', 'Reunion', 'Second Chance Romance', 'Coming of Age', 'Slow Burn', 'Emotional', 'Heartwarming', 'Nostalgic', 'Identity', 'Healing', 'Young Adult'],
    updated_at = now()
WHERE title_name_kr = '펌킨타임';

UPDATE titles
SET keywords = ARRAY['Romance', 'Romantic Comedy', 'Time Travel', 'High School Romance', 'Mystery', 'Teenagers', 'Contemporary', 'Female Lead', 'Coming of Age', 'Destiny', 'Technology', 'School', 'Fated Mates', 'Heartwarming', 'Feel-Good', 'Character-Driven', 'Young Adult', 'Lighthearted', 'Quirky'],
    updated_at = now()
WHERE title_name_kr = '미래 남편 누구게?';

UPDATE titles
SET keywords = ARRAY['Medieval', 'Alternate Reality', 'Quest', 'Coming of Age', 'Self-Discovery', 'Supernatural', 'Magic', 'Mystery', 'Action Adventure'],
    updated_at = now()
WHERE title_name_kr = 'NPC';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Coming of Age', 'Romance', 'Slice of Life', 'Feel-Good', 'Relatable', 'Character-Driven', 'Modern Era', 'Young Adult', 'Female Lead', 'Self-Discovery', 'Dreams', 'Pop Culture', 'Cinema', 'Romantic Comedy', 'Sweet Romance', 'Heartwarming'],
    updated_at = now()
WHERE title_name_kr = '언무드셀라';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Romance', 'Erotic Romance', 'LGBTQIA+', 'Sex Positivity', 'Childhood Friends', 'Reunion', 'Secret Identity', 'Fake Relationship', 'Roommates to Lovers', 'Forbidden Love', 'Hidden Relationship', 'Trauma', 'Healing', 'Second Chance Romance', 'Steamy'],
    updated_at = now()
WHERE title_name_kr = '처음부터 너였어';

UPDATE titles
SET keywords = ARRAY['Mystery', 'Supernatural', 'Survival', 'Small Town', 'Trapped Together', 'Contemporary', 'Suspenseful', 'Dark', 'Atmospheric'],
    updated_at = now()
WHERE title_name_kr = '마야고';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Romance', 'Neighbors to Lovers', 'Rescue Romance', 'Slice of Life', 'Tragic'],
    updated_at = now()
WHERE title_name_kr = '틈 (엿보기)';

UPDATE titles
SET keywords = ARRAY['Romance', 'Time Travel', 'School', 'Teenagers', 'Mystery', 'Romantic Comedy', 'Contemporary', 'High School Romance', 'Mistaken Identity', 'Love Triangle'],
    updated_at = now()
WHERE title_name_kr = '남자친구를 조심해';

UPDATE titles
SET keywords = ARRAY['Family', 'Coming of Age', 'Trauma', 'Healing', 'Loss', 'Grief', 'Hope', 'Heartwarming', 'Poignant', 'Emotional', 'Tearjerker', 'Contemporary', 'Slice of Life', 'Found Family', 'Redemption', 'Character-Driven'],
    updated_at = now()
WHERE title_name_kr = '럭키고 해피';

UPDATE titles
SET keywords = ARRAY['Romance', 'Age Gap', 'Forbidden Love', 'Ghosts', 'Supernatural', 'Tragic Past', 'Love Triangle', 'Teacher Student', 'Widower', 'Grief', 'Emotional', 'Angsty', 'Bittersweet', 'Contemporary', 'Unrequited Love'],
    updated_at = now()
WHERE title_name_kr = '그래도 사랑해';

UPDATE titles
SET keywords = ARRAY['MM Romance', 'Roommates to Lovers', 'Opposites Attract', 'Contemporary', 'LGBTQIA+', 'Romantic Comedy', 'Enemies to Lovers', 'Forced Proximity', 'Sex Positivity', 'Grumpy Sunshine', 'Steamy', 'Slice of Life', 'Modern Era'],
    updated_at = now()
WHERE title_name_kr = '공유하는 집';

UPDATE titles
SET keywords = ARRAY['Historical', 'Coming of Age', 'Powers', 'Magic', 'Action Adventure', 'Supernatural', 'Bullying', 'Quest', 'Transformation', 'Martial Arts', 'Village'],
    updated_at = now()
WHERE title_name_kr = '탈대전';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'College', 'Art', 'Female Lead', 'Enemies to Lovers', 'Rivals to Lovers', 'Mystery', 'Secrets', 'Young Adult', 'Romance', 'Rivals in Business', 'School', 'Forced Proximity', 'Workplace Romance'],
    updated_at = now()
WHERE title_name_kr = '노이즈컴백';

UPDATE titles
SET keywords = ARRAY['MM Romance', 'Celebrity and Fan', 'Contemporary', 'LGBTQIA+', 'Writer and Editor', 'Celebrity Romance', 'Fake Relationship', 'Secret Crush', 'Enemies to Lovers', 'Modern Era', 'Romantic Comedy', 'Workplace Romance'],
    updated_at = now()
WHERE title_name_kr = '팬 픽션';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Romance', 'Enemies to Lovers', 'Celebrity and Fan', 'Idol and Manager', 'Reality Show Romance', 'Age Gap - Younger Hero / Older Heroine', 'Opposites Attract', 'Fake Relationship', 'Family', 'Music', 'Pop Culture', 'Romantic Comedy', 'Workplace Romance', 'Reluctant Lovers', 'Grumpy Sunshine'],
    updated_at = now()
WHERE title_name_kr = '우리집 아이돌';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Romance', 'Romantic Drama', 'LGBTQIA+', 'MM Romance', 'Long-term lovers', 'Angsty', 'Emotional', 'Bittersweet', 'Second Chance Romance', 'Healing', 'Trust', 'Growth'],
    updated_at = now()
WHERE title_name_kr = '빨강';

UPDATE titles
SET keywords = ARRAY['Romance', 'Love Triangle', 'Contemporary', 'Mythology', 'Fairies', 'Supernatural', 'Coming of Age', 'Female Lead', 'Enemies to Lovers', 'Forbidden Love', 'Class Divide', 'Different Worlds', 'Mountain', 'Romantic Comedy', 'Transformation', 'Family', 'Destiny'],
    updated_at = now()
WHERE title_name_kr = '삼각산 선녀탕';

UPDATE titles
SET keywords = ARRAY['School', 'Teenagers', 'Coming of Age', 'Female Lead', 'Friendship', 'Contemporary', 'Slice of Life', 'Feel-Good', 'Funny', 'Heartwarming', 'Character-Driven', 'Relatable', 'Growth', 'High School Romance', 'Quirky', 'Lighthearted', 'Modern Era'],
    updated_at = now()
WHERE title_name_kr = '코코스튜';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Romance', 'Psychological Romance', 'Marriage in Crisis', 'Betrayal', 'Secrets', 'Forbidden Love', 'Obsession', 'Desire', 'Lies', 'Truth', 'Identity', 'Emotional', 'Angsty', 'Dramatic', 'Intense', 'Dark', 'Unreliable Narrator', 'Double Cross'],
    updated_at = now()
WHERE title_name_kr = '당신의 아내를 접수합니다';

UPDATE titles
SET keywords = ARRAY['Supernatural', 'Mystery', 'Crime', 'Occult', 'Ghosts', 'Murder', 'Modern Era', 'Contemporary', 'Dark', 'Suspenseful', 'Character-Driven'],
    updated_at = now()
WHERE title_name_kr = '빙의';

UPDATE titles
SET keywords = ARRAY['College Romance', 'Trauma', 'Coming of Age', 'Contemporary', 'Senpai and Kouhai', 'Healing', 'Second Chance Romance', 'Emotional', 'Slow Burn', 'Character-Driven', 'Young Adult', 'Guarded', 'Trust', 'Wounded', 'Redemption', 'Self-Discovery', 'Angsty'],
    updated_at = now()
WHERE title_name_kr = '한 번도 상처받지 않은 것처럼';

UPDATE titles
SET keywords = ARRAY['Romance', 'Coming of Age', 'Childhood', 'Family', 'Slice of Life', 'Heartwarming', 'Healing', 'Love Triangle', 'Unrequited Love', 'Childhood Friends', 'Contemporary', 'Feel-Good', 'Character-Driven', 'Emotional', 'Sweet Romance', 'Clean Romance'],
    updated_at = now()
WHERE title_name_kr = '사랑이 커다래';

UPDATE titles
SET keywords = ARRAY['Coming of Age', 'Disability', 'Bullying', 'Trauma', 'Sports Team Romance', 'Rivals to Lovers', 'Overcoming', 'Resilience', 'Contemporary', 'Young Adult', 'Character-Driven', 'Inspirational', 'Redemption', 'Self-Discovery', 'Found Family'],
    updated_at = now()
WHERE title_name_kr = '더 익스트림';

UPDATE titles
SET keywords = ARRAY['Supernatural', 'Romance', 'Body Swapping', 'Time Travel', 'Mystery', 'Transformation', 'Soulmates', 'Protective Hero', 'Contemporary', 'Slice of Life', 'Heartwarming', 'Slow Burn', 'Found Family'],
    updated_at = now()
WHERE title_name_kr = '아임 펫!';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Romance', 'Neighbors to Lovers', 'Opposites Attract', 'Small Town', 'Enemies to Lovers', 'Grumpy Sunshine', 'Female Lead', 'Bittersweet', 'Workplace Romance', 'Healing', 'Trust'],
    updated_at = now()
WHERE title_name_kr = '네 이웃의 취향';

UPDATE titles
SET keywords = ARRAY['Afterlife', 'Supernatural', 'Romance', 'Contemporary', 'Female Lead', 'Enemies to Lovers', 'Hell', 'Demons', 'Forced Proximity', 'Grumpy Sunshine', 'Supernatural Romance', 'Paranormal Romance', 'Modern Era', 'Urban Fantasy'],
    updated_at = now()
WHERE title_name_kr = '염라의 숨결';

UPDATE titles
SET keywords = ARRAY['Romance', 'Contemporary', 'Opposites Attract', 'Artist', 'Long-Distance Relationship', 'Age Gap', 'Different Worlds'],
    updated_at = now()
WHERE title_name_kr = '윌유메리미';

UPDATE titles
SET keywords = ARRAY['Family', 'Romance', 'Contemporary', 'Slice of Life', 'Heartwarming', 'Feel-Good', 'Lighthearted', 'Healing', 'Cozy', 'Wholesome', 'Character-Driven'],
    updated_at = now()
WHERE title_name_kr = '사랑도 튀기면 맛있나요';

UPDATE titles
SET keywords = ARRAY['Female Lead', 'Love Triangle', 'Forbidden Love', 'Tragic Past', 'Romance', 'Contemporary', 'Emotional'],
    updated_at = now()
WHERE title_name_kr = '사장님은 투타임';

UPDATE titles
SET keywords = ARRAY['Supernatural', 'Romance', 'Contemporary', 'LGBTQIA+', 'MM Romance', 'Coworkers to Lovers', 'Roommates to Lovers', 'Supernatural Romance', 'Mythology', 'Religion', 'Family', 'Sacrifice', 'Duty', 'Domestic Bliss After Chaos', 'Quirky', 'Feel-Good', 'Heartwarming'],
    updated_at = now()
WHERE title_name_kr = '항변신';

UPDATE titles
SET keywords = ARRAY['Coming of Age', 'Quest', 'Powers', 'Superhero', 'Parody', 'Zany', 'Quirky', 'Martial Arts', 'Action Adventure', 'Shonen', 'Redemption', 'Self-Discovery'],
    updated_at = now()
WHERE title_name_kr = '우당탕탕 따식이';

UPDATE titles
SET keywords = ARRAY['LGBTQIA+', 'FF Romance', 'School', 'Contemporary', 'Coming of Age', 'Music', 'Slice of Life', 'Sweet Romance', 'Slow Burn', 'Enemies to Lovers', 'Female Lead', 'Young Adult', 'Heartwarming'],
    updated_at = now()
WHERE title_name_kr = '소음';

UPDATE titles
SET keywords = ARRAY['Coming of Age', 'Family', 'Slice of Life', 'Young Adult', 'Lighthearted', 'Funny', 'Zany', 'Feel-Good', 'Contemporary', 'Parody', 'Pop Culture', 'Teenagers'],
    updated_at = now()
WHERE title_name_kr = '무식아';

UPDATE titles
SET keywords = ARRAY['LGBTQIA+', 'MM Romance', 'Contemporary', 'Forbidden Love', 'Secret Crush', 'One Night Stand', 'Secret Identity', 'Hidden Relationship', 'Neighbors to Lovers', 'Friends to Lovers', 'Childhood Friends', 'Unrequited Love', 'Double Cross', 'Erotic Romance', 'Steamy', 'Explicit', 'Modern Era', 'Romance', 'Romantic Drama', 'Angsty', 'Intense', 'Passionate'],
    updated_at = now()
WHERE title_name_kr = '옆집 형';

UPDATE titles
SET keywords = ARRAY['Magic', 'Romance', 'Witches', 'Small Town', 'Coming of Age', 'Forbidden Love', 'Healing', 'Trauma', 'Mystery', 'Historical Fantasy', 'Childhood Friends', 'Friends to Lovers', 'Protective Hero', 'Wounded', 'Redemption', 'Secrets', 'Village', 'Young Adult'],
    updated_at = now()
WHERE title_name_kr = '에일리의 정원';

UPDATE titles
SET keywords = ARRAY['Romance', 'Contemporary', 'Disability', 'Healing', 'Soulmates', 'Fated Mates', 'Opposites Attract', 'Heartwarming', 'Feel-Good', 'Emotional', 'Sweet Romance', 'Destined Connection', 'Transformation', 'Hope', 'Love at First Sight', 'Cinematic'],
    updated_at = now()
WHERE title_name_kr = '세렌디피티';

UPDATE titles
SET keywords = ARRAY['Family', 'Disability', 'Coming of Age', 'Heartwarming', 'Feel-Good', 'Emotional', 'Slice of Life', 'Contemporary', 'Childhood', 'Trauma', 'Healing', 'Resilience', 'Found Family', 'Belonging', 'Hope', 'Courage', 'Overcoming', 'Self-Discovery', 'Orphan', 'Small Town'],
    updated_at = now()
WHERE title_name_kr = '절하는 강아지';

UPDATE titles
SET keywords = ARRAY['Dimensions', 'Alternate Reality', 'Contemporary', 'Romance', 'Fantasy Romance', 'Paranormal Romance', 'Time Travel', 'Enemies to Lovers', 'Forced Proximity', 'Mistaken Identity', 'Amnesia', 'Captive Falls for Captor', 'Forbidden Love', 'Passionate Lovers', 'Different Worlds', 'Trauma', 'Mind Control'],
    updated_at = now()
WHERE title_name_kr = '에버그린';

UPDATE titles
SET keywords = ARRAY['High School Romance', 'Supernatural Romance', 'Witches', 'Supernatural', 'Teenagers', 'School', 'Contemporary', 'Female Lead', 'Destiny', 'Forbidden Love', 'Enemies to Lovers', 'Healing Love', 'Fated Mates', 'Hidden Powers', 'Secret Identity', 'Tragic Past', 'Redemption', 'Coming of Age'],
    updated_at = now()
WHERE title_name_kr = '견우와 선녀';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Slice of Life', 'Business', 'Cafe/Restaurant Romance', 'Coworkers to Lovers', 'Boss and Intern', 'Workplace Romance', 'Opposites Attract', 'Grumpy Sunshine', 'Small Town', 'Heartwarming', 'Character-Driven', 'Slow Burn', 'Down-to-Earth', 'Relatable'],
    updated_at = now()
WHERE title_name_kr = '스윗솔티';

UPDATE titles
SET keywords = ARRAY['Female Lead', 'Princess', 'Royalty', 'Apocalyptic', 'Dying Earth', 'Coming of Age', 'Destiny', 'Royal Drama', 'Epic Saga', 'Political Intrigue', 'Survival'],
    updated_at = now()
WHERE title_name_kr = '시히트왕국정복기';

UPDATE titles
SET keywords = ARRAY['Magic', 'Coming of Age', 'Contemporary', 'Transformation', 'Powers', 'Urban Fantasy', 'Self-Discovery', 'Modern Era', 'Supernatural', 'Character-Driven', 'Lighthearted', 'Quirky', 'Feel-Good'],
    updated_at = now()
WHERE title_name_kr = '마법사';

UPDATE titles
SET keywords = ARRAY['Powers', 'Supernatural', 'Antihero', 'Crime', 'Government', 'Police', 'Incarceration', 'Action Adventure', 'Contemporary', 'Modern Era', 'Rebel', 'Superhero'],
    updated_at = now()
WHERE title_name_kr = '지구의 주인과 시녀가 된 나';

UPDATE titles
SET keywords = ARRAY['Far Future', 'Space', 'Science', 'Artificial Intelligence', 'Dystopian', 'Sci-Fi Romance', 'Erotic Romance', 'Explicit', 'Scientist', 'Survival', 'Apocalyptic', 'Technology', 'Forced Proximity', 'Diversity'],
    updated_at = now()
WHERE title_name_kr = 'NASSA';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Romance', 'LGBTQIA+', 'Coming of Age', 'Young Adult', 'Childhood Friends', 'Unrequited Love', 'Love Triangle', 'Coworkers to Lovers', 'Roommates to Lovers', 'Forced Proximity', 'Only One Bed', 'Second Chance Romance', 'Angsty', 'Emotional'],
    updated_at = now()
WHERE title_name_kr = '이상적인 관계';

UPDATE titles
SET keywords = ARRAY['Contemporary', 'Forbidden Love', 'Secret Relationship', 'Family', 'Erotic Romance', 'Explicit', 'Open Door', 'Steamy', 'Intense', 'Dramatic', 'Angsty', 'Secrets', 'Temptation', 'Desire', 'Obsession'],
    updated_at = now()
WHERE title_name_kr = '해금';

UPDATE titles
SET keywords = ARRAY['Apocalyptic', 'Powers', 'High School Romance', 'Teenagers', 'Female Lead', 'Coming of Age', 'Superhero', 'Action Adventure', 'Quirky', 'Romantic Comedy', 'School', 'Contemporary', 'Young Adult', 'Shonen', 'Redemption', 'Romance'],
    updated_at = now()
WHERE title_name_kr = '소녀히어로';

UPDATE titles
SET keywords = ARRAY['Family', 'Survival', 'Mystery', 'Supernatural', 'Island Nation', 'Contemporary', 'Suspenseful', 'Dark', 'Atmospheric', 'Trapped Together', 'Forced Proximity', 'Creatures', 'Horror Romance', 'Psychological Romance', 'Small Town'],
    updated_at = now()
WHERE title_name_kr = '나 홀로 섬에';

UPDATE titles
SET keywords = ARRAY['Teenagers', 'High School Romance', 'Murder', 'Crime', 'Captive Falls for Captor', 'Trauma', 'Revenge', 'Psychological Romance', 'Dark', 'Intense', 'Enemies to Lovers', 'Dangerous Drama', 'Mystery', 'Suspenseful', 'Contemporary', 'Female Lead', 'Forbidden Love', 'Angsty', 'Dramatic'],
    updated_at = now()
WHERE title_name_kr = '위험한 동거';

UPDATE titles
SET keywords = ARRAY['Parody', 'Zany', 'Pop Culture', 'Art', 'Slice of Life', 'Lighthearted', 'Funny', 'Witty', 'Playful', 'Quirky', 'Feel-Good', 'Irreverent', 'Contemporary', 'Modern Era'],
    updated_at = now()
WHERE title_name_kr = '2차원 개그';

UPDATE titles
SET keywords = ARRAY['MM Romance', 'Revenge', 'Forbidden Stepbrother', 'Enemies to Lovers', 'Contemporary', 'Childhood Friends', 'Trauma', 'Family', 'LGBTQIA+', 'Angsty', 'Dark', 'Intense', 'Second Chance Romance', 'Forced Proximity', 'One Night Stand', 'Passionate'],
    updated_at = now()
WHERE title_name_kr = '영블러드';

UPDATE titles
SET keywords = ARRAY['Supernatural', 'Creatures', 'Family', 'Countryside', 'Village', 'Coming of Age', 'Friendship', 'Slice of Life', 'Heartwarming', 'Feel-Good', 'Contemporary', 'Healing', 'Community', 'Found Family', 'Belonging', 'Resilience', 'Cultural Clash', 'Cozy'],
    updated_at = now()
WHERE title_name_kr = '안녕 도깨비';

UPDATE titles
SET keywords = ARRAY['Cinema', 'Parody', 'Zany', 'Weird', 'Pop Culture', 'Unreliable Narrator', 'Contemporary', 'Quirky', 'Irreverent', 'Satirical'],
    updated_at = now()
WHERE title_name_kr = '부기영화';

-- Log update count
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % title(s) with new keywords', updated_count;
END $$;

COMMIT;
