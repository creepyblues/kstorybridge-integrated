-- Step 1: Add keywords column to titles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'titles' AND column_name = 'keywords') THEN
        ALTER TABLE titles ADD COLUMN keywords text[];
        COMMENT ON COLUMN titles.keywords IS 'Extracted keywords for content discovery and search';
    END IF;
END $$;

-- Step 2: Update keywords field with extracted keyword data

-- 세렌디피티 (serendipity) - 4 keywords
UPDATE titles SET keywords = ARRAY['serendipity', '세렌디피티', 'Drama', 'Growth'] WHERE title_id = 'bd688163-0a61-4e67-a125-95644e5be942';

-- 영블러드 (Young Blood) - 3 keywords
UPDATE titles SET keywords = ARRAY['young', 'blood', '영블러드'] WHERE title_id = 'eda7e1d9-211a-4c9e-bd26-8eda72f58030';

-- 사랑도 튀기면 맛있나요 (Is love delicious fried as well?) - 19 keywords
UPDATE titles SET keywords = ARRAY['love', 'delicious', 'fried', 'well', '사랑도', '튀기면', '맛있나요', 'Dailylife', 'romance', 'love story', 'romantic comedy', 'love triangle', 'relationship', 'marriage', 'dating', 'heartbreak', 'passion', 'familycomedy', 'healing'] WHERE title_id = '3cce946a-e45b-4c36-84b4-fc45b5ccec0e';

-- 나 홀로 섬에 (Alone on the island) - 4 keywords
UPDATE titles SET keywords = ARRAY['island', 'alone', 'Boy', 'Thriller'] WHERE title_id = 'd5d4bd2b-7772-4905-8fbe-bcb21991491b';

-- 무식아 (Moosick) - 4 keywords
UPDATE titles SET keywords = ARRAY['moosick', '무식아', 'gags', 'episodes'] WHERE title_id = '93519f7f-5859-48c7-9130-1c829b07b382';

-- 마법사 (Magician) - 12 keywords
UPDATE titles SET keywords = ARRAY['magic', 'magician', '마법사', 'gag', 'fantasy', 'supernatural', 'mythical creatures', 'alternate world', 'prophecy', 'quest', 'powers', 'enchantment'] WHERE title_id = '4ca035cf-4cb7-40d0-85a2-e454ce98abcd';

-- 지구의 주인과 시녀가 된 나 (Owner And Me) - 13 keywords
UPDATE titles SET keywords = ARRAY['owner', '지구의', '주인과', '시녀가', 'fantasy', 'magic', 'supernatural', 'mythical creatures', 'alternate world', 'prophecy', 'quest', 'powers', 'enchantment'] WHERE title_id = 'e712de2c-1ce2-4b96-8a16-edecd9b51906';

-- 소음 (Noise) - 1 keywords
UPDATE titles SET keywords = ARRAY['noise'] WHERE title_id = '5366dcf1-372b-4a0e-ba7a-5d701c93efa6';

-- 사랑이 커다래 (Love Is Big) - 6 keywords
UPDATE titles SET keywords = ARRAY['love', 'big', '사랑이', '커다래', 'Dailylife', 'cutcartoon'] WHERE title_id = '410d11e7-dfb9-4956-a776-0249f1dc93e1';

-- 한 번도 상처받지 않은 것처럼 (Like You've Never Been Hurt) - 26 keywords
UPDATE titles SET keywords = ARRAY['like', 'youve', 'never', 'hurt', '상처받지', '것처럼', 'Dailylife', 'romance', 'love story', 'romantic comedy', 'love triangle', 'relationship', 'marriage', 'dating', 'heartbreak', 'passion', 'drama', 'emotional depth', 'character development', 'family drama', 'social issues', 'human condition', 'relationships', 'conflict', 'growth', 'story'] WHERE title_id = 'ee251fb4-4cd0-4e79-bf9f-0b372c5b0c92';

-- 더 익스트림 (The Extreme) - 4 keywords
UPDATE titles SET keywords = ARRAY['extreme', '익스트림', 'Boy', 'Drama'] WHERE title_id = '81e5096e-e76d-4b2f-acf9-4119e706a9e7';

-- 사장님은 투타임 (The owner is two-time.) - 7 keywords
UPDATE titles SET keywords = ARRAY['owner', 'two-time', '사장님은', '투타임', 'Romance', 'Drama', 'Fantasy'] WHERE title_id = '3b379e9e-e5c0-4e19-87ba-a0f076cda7fb';

-- 아임 펫! (I Am Pet) - 11 keywords
UPDATE titles SET keywords = ARRAY['pet', 'comedy', 'humor', 'satire', 'slapstick', 'witty dialogue', 'situational comedy', 'parody', 'light-hearted', 'entertainment', 'companiondogs'] WHERE title_id = 'dc4812b0-99b4-4ad0-8025-ece51a1c6354';

-- 빙의 (The Possession) - 3 keywords
UPDATE titles SET keywords = ARRAY['possession', 'Thriller', 'exorcism'] WHERE title_id = '6b7e6239-00a6-4279-8b10-82629092bb56';

-- 절하는 강아지 (Bowing Puppy) - 5 keywords
UPDATE titles SET keywords = ARRAY['bowing', 'puppy', '절하는', '강아지', 'daily'] WHERE title_id = '7b64aa0f-735c-46c9-ab83-fa2d73086f5a';

-- 견우와 선녀 (Gyoun-woo and Seon-nyeo.) - 5 keywords
UPDATE titles SET keywords = ARRAY['gyoun-woo', 'seon-nyeo', '견우와', 'Romance', 'Story'] WHERE title_id = '85c7ab65-8e80-4cd8-bfbc-10ee47fdb4d9';

-- NASSA (NASSA) - 3 keywords
UPDATE titles SET keywords = ARRAY['nassa', 'Adult', 'Fantasy'] WHERE title_id = '5b93f6fe-be38-4f9e-99d4-ad4a59f0eb88';

-- 에일리의 정원 (Ailee's Garden) - 10 keywords
UPDATE titles SET keywords = ARRAY['past', 'hear', 'ailees', 'mother', 'witch', 'sickness', 'garden', '에일리의', 'Romance', 'Fantasy'] WHERE title_id = '9ddf46c1-02ca-4bb9-80ae-74ad50910c78';

-- 스윗솔티 (Sweet salty) - 14 keywords
UPDATE titles SET keywords = ARRAY['sweet', 'salty', '스윗솔티', 'Dailylife', 'healing', 'drama', 'emotional depth', 'character development', 'family drama', 'social issues', 'human condition', 'relationships', 'conflict', 'story'] WHERE title_id = '3ec36daf-e232-4034-8cb2-cae4856eadf0';

-- 우당탕탕 따식이 (Ddasick) - 5 keywords
UPDATE titles SET keywords = ARRAY['ddasick', '우당탕탕', '따식이', 'gag', 'crazy'] WHERE title_id = '1073df53-2498-4fc4-904a-be6d864656bc';

-- 노이즈컴백 (Noise Comeback) - 5 keywords
UPDATE titles SET keywords = ARRAY['noise', 'comeback', '노이즈컴백', 'Drama', 'Romance'] WHERE title_id = '07277ccc-92df-4a0c-87e4-519a86216483';

-- 삼각산 선녀탕 (Samgaksan Fairy Bath) - 8 keywords
UPDATE titles SET keywords = ARRAY['samgaksan', 'fairy', 'bath', '삼각산', '선녀탕', 'Romance', 'Drama', 'Comedy'] WHERE title_id = 'bcfb591e-2b12-43ff-836d-c90acfba9976';

-- 옆집 형 (The guy next door) - 3 keywords
UPDATE titles SET keywords = ARRAY['guy', 'next', 'door'] WHERE title_id = 'ba075a52-f6df-4bf1-bff9-7590b349744d';

-- 소녀히어로 (Girl Hero) - 6 keywords
UPDATE titles SET keywords = ARRAY['hero', 'girl', '소녀히어로', 'Fantasy', 'Growth', 'School'] WHERE title_id = 'b96a2368-ef6d-4436-9fa9-d9bbb591f321';

-- 네 이웃의 취향 (Neighbor Taste) - 14 keywords
UPDATE titles SET keywords = ARRAY['neighbor', 'taste', '이웃의', 'Novel', 'novelcomics', 'romance', 'love story', 'romantic comedy', 'love triangle', 'relationship', 'marriage', 'dating', 'heartbreak', 'passion'] WHERE title_id = '93430655-3c2c-4049-8df7-0fc68b13ce19';

-- Progress: 25/245 titles updated

-- 에버그린 (evergreen) - 12 keywords
UPDATE titles SET keywords = ARRAY['evergreen', '에버그린', 'adult', 'fantasy', 'magic', 'supernatural', 'mythical creatures', 'alternate world', 'prophecy', 'quest', 'powers', 'enchantment'] WHERE title_id = '8673d04f-ad38-4d34-a261-716a4fcd60aa';

-- 안녕 도깨비 (Hello Doggaebi) - 5 keywords
UPDATE titles SET keywords = ARRAY['hello', 'doggaebi', '도깨비', 'Romance', 'Fantasy'] WHERE title_id = '1ac61df1-13de-4915-aac2-9dfbbd125156';

-- 부기영화 (Boogie Movie) - 5 keywords
UPDATE titles SET keywords = ARRAY['boogie', 'movie', '부기영화', 'Reviews', 'gags'] WHERE title_id = '232532dc-efbc-490d-aa34-875d0a12696d';

-- 팬 픽션 (Never Mind Darling) - 4 keywords
UPDATE titles SET keywords = ARRAY['never', 'mind', 'darling', 'gag'] WHERE title_id = 'a269c6c1-03a7-4fd3-ab0d-0e05aa3be46b';

-- 이상적인 관계 (Ideal Us) - 5 keywords
UPDATE titles SET keywords = ARRAY['ideal', '이상적인', 'Romance', 'Story', 'DailyLife'] WHERE title_id = '496703ad-e4f7-4e0b-af4b-01145673fb8a';

-- 해금 (removing) - 12 keywords
UPDATE titles SET keywords = ARRAY['removing', 'Adult', 'romance', 'love story', 'romantic comedy', 'love triangle', 'relationship', 'marriage', 'dating', 'heartbreak', 'passion', 'melodrama'] WHERE title_id = 'ba34b193-7655-40cc-818e-26350f4f40c4';

-- 위험한 동거 (dangerous_cohabitation) - 11 keywords
UPDATE titles SET keywords = ARRAY['dangerous_cohabitation', '위험한', 'thriller', 'suspense', 'tension', 'mystery', 'danger', 'psychological', 'cat and mouse', 'edge of seat', 'plot twists'] WHERE title_id = 'f3427f37-8efc-41b5-9eff-4d6b6be5c5cc';

-- 2차원 개그 (2D Comedy) - 3 keywords
UPDATE titles SET keywords = ARRAY['comedy', '2차원', 'gag'] WHERE title_id = 'e5e70e91-1a7f-44c5-b869-aedb7146807c';

-- 우리집 아이돌 (Idol House) - 9 keywords
UPDATE titles SET keywords = ARRAY['house', 'idol', '우리집', '아이돌', 'Romance', 'gags', 'stories', 'dailylife', 'idols'] WHERE title_id = '5a09f56d-2f9b-47c2-9725-37b02227ea44';

-- 빨강 (red) - 13 keywords
UPDATE titles SET keywords = ARRAY['red', 'Drama', 'romance', 'love story', 'romantic comedy', 'love triangle', 'relationship', 'marriage', 'dating', 'heartbreak', 'passion', 'growth', 'story'] WHERE title_id = 'f3656329-ee34-4ba8-9243-c1de703c129a';

-- 윌유메리미 (Will You Marry Me) - 4 keywords
UPDATE titles SET keywords = ARRAY['marry', '윌유메리미', 'Dailylife', 'gags'] WHERE title_id = '28997934-79a3-433a-98b7-8182a8ee83a5';

-- 항변신 (Hang byun sin) - 23 keywords
UPDATE titles SET keywords = ARRAY['hang', 'byun', 'sin', '항변신', 'Fantasy', 'romance', 'love story', 'romantic comedy', 'love triangle', 'relationship', 'marriage', 'dating', 'heartbreak', 'passion', 'comedy', 'humor', 'satire', 'slapstick', 'witty dialogue', 'situational comedy', 'parody', 'light-hearted', 'entertainment'] WHERE title_id = '486b5bba-570a-4b5f-9e9e-8a3d64516410';

-- 시히트왕국정복기 (The Sichit Kingdom) - 5 keywords
UPDATE titles SET keywords = ARRAY['sichit', 'kingdom', '시히트왕국정복기', 'Romance', 'Fantasy'] WHERE title_id = '260215ca-969a-420e-846a-bf15f6137034';

-- 코코스튜 (Cocostew) - 4 keywords
UPDATE titles SET keywords = ARRAY['cocostew', '코코스튜', 'Gag', 'School'] WHERE title_id = '7b34fe73-22e0-4ebe-a21e-38b8efe93b6a';

-- 당신의 아내를 접수합니다 (I accept your wife) - 7 keywords
UPDATE titles SET keywords = ARRAY['accept', 'wife', '당신의', '아내를', '접수합니다', 'Adult', 'NTR'] WHERE title_id = '096b1f5c-f46b-474c-83a0-4cd32f9a722e';

-- 염라의 숨결 (A good relationship) - 5 keywords
UPDATE titles SET keywords = ARRAY['good', 'relationship', '염라의', 'Romance', 'Fantasy'] WHERE title_id = '8e9680ca-6e23-4b5e-9868-b30717bb8705';

-- 사랑에 번역앱이 필요한가요? (Love translrator) - 6 keywords
UPDATE titles SET keywords = ARRAY['love', 'translrator', '사랑에', '번역앱이', '필요한가요', 'Romance'] WHERE title_id = '1106aa84-8ef0-4c79-ba35-883e726a482c';

-- 베텔게우스 (Betelgeuse) - 14 keywords
UPDATE titles SET keywords = ARRAY['betelgeuse', '베텔게우스', 'Drama', 'fantasy', 'magic', 'supernatural', 'mythical creatures', 'alternate world', 'prophecy', 'quest', 'powers', 'enchantment', 'school', 'SFfantasy'] WHERE title_id = '211aa976-c2fa-4997-a8c3-c980f5501978';

-- 영웅 강철남 (Steelman) - 3 keywords
UPDATE titles SET keywords = ARRAY['steelman', '강철남', 'blackcomedy'] WHERE title_id = '209bdf51-d620-48f9-af53-d189a8b9027f';

-- 도대체 왜?인구단 (Why Club) - 5 keywords
UPDATE titles SET keywords = ARRAY['club', '도대체', '왜인구단', 'Dailylife', 'gags'] WHERE title_id = '3fd5f1b3-a471-4949-a608-197f248e81bb';

-- 웃지 않는 개그반 (comedyclass) - 3 keywords
UPDATE titles SET keywords = ARRAY['comedyclass', '개그반', 'gag'] WHERE title_id = 'aeadc37b-7704-40ef-91cb-1d8152378b66';

-- 웽툰 시즌5 (Wooeng season5) - 5 keywords
UPDATE titles SET keywords = ARRAY['wooeng', 'season5', '시즌5', 'Dailylife', 'gags'] WHERE title_id = '1808024d-daf4-41af-8f24-707c3d055319';

-- 마야고 (Mayago) - 4 keywords
UPDATE titles SET keywords = ARRAY['mayago', '마야고', 'Thriller', 'exorcism'] WHERE title_id = '99c993d7-d45d-4279-9663-30c40272c5b3';

-- 틈 (엿보기) (crack) - 4 keywords
UPDATE titles SET keywords = ARRAY['crack', '엿보기', 'Adult', 'Drama'] WHERE title_id = 'a32469e1-8482-4d60-af7f-6a0ad9420a67';

-- 아스라이 (Dimly dontforgetme) - 5 keywords
UPDATE titles SET keywords = ARRAY['dimly', 'dontforgetme', '아스라이', 'Drama', 'Family'] WHERE title_id = 'f08ff952-9d94-45ac-a9a6-22c3bd818ca6';

-- Progress: 50/245 titles updated

-- 그녀의 버킷리스트 (Her Bucketlist) - 4 keywords
UPDATE titles SET keywords = ARRAY['bucketlist', '그녀의', '버킷리스트', 'Romance'] WHERE title_id = '27052265-55e5-438b-808a-9bac8d5b430d';

-- 탈대전 (TALDAEJEON) - 5 keywords
UPDATE titles SET keywords = ARRAY['taldaejeon', '탈대전', 'Boy', 'orientalfantasy', 'coming-of-agestory'] WHERE title_id = '6f298880-49c2-4136-af10-191748c7f21a';

-- 운영자의 권한으로 (Authority Of The Operator) - 6 keywords
UPDATE titles SET keywords = ARRAY['authority', 'operator', '운영자의', '권한으로', 'Boy', 'Thriller'] WHERE title_id = 'a96bf595-e967-45b9-bc83-31031ed3ff9e';

-- 이로운 변태 (Beneficial Pervert) - 4 keywords
UPDATE titles SET keywords = ARRAY['beneficial', 'pervert', '이로운', 'Romance'] WHERE title_id = '59349d48-67ed-4f59-9d32-7bc30368f156';

-- 펌킨타임 (Pumpkin time) - 4 keywords
UPDATE titles SET keywords = ARRAY['pumpkin', 'time', '펌킨타임', 'Romance'] WHERE title_id = '86923a10-d4ad-4f5e-a1f2-9eb141d408c5';

-- 사랑양장점 (Love Boutique) - 4 keywords
UPDATE titles SET keywords = ARRAY['love', 'boutique', '사랑양장점', 'Romance'] WHERE title_id = '4ed02130-53a7-4696-b5d0-6747f3c4f032';

-- 우리 모두는 누군가의 첫사랑이었다 (We were all someone's first love.) - 16 keywords
UPDATE titles SET keywords = ARRAY['love', 'someones', 'first', '모두는', '누군가의', '첫사랑이었다', 'School', 'romance', 'love story', 'romantic comedy', 'love triangle', 'relationship', 'marriage', 'dating', 'heartbreak', 'passion'] WHERE title_id = '31c10161-d303-420d-822b-5415fba1dba9';

-- 얼굴미화부 (Beauty Maker) - 6 keywords
UPDATE titles SET keywords = ARRAY['beauty', 'maker', '얼굴미화부', 'Beauty', 'Growth', 'Drama'] WHERE title_id = '099a93fc-6dee-467f-8b00-c79058b42844';

-- 날 만나러 가요 (findingme) - 4 keywords
UPDATE titles SET keywords = ARRAY['findingme', '만나러', 'Healing', 'travel'] WHERE title_id = '79b74ff4-71bf-4c0d-8a4b-4d103869db67';

-- 후드 (Hood) - 4 keywords
UPDATE titles SET keywords = ARRAY['hood', 'Fantasy', 'Boy', 'Action'] WHERE title_id = '8bb915cc-1cbc-4438-9970-61c037d71efd';

-- 고양이 뚜껑 (Cat Cap) - 14 keywords
UPDATE titles SET keywords = ARRAY['real', 'butler', 'story', 'cats', 'humans', 'living', 'together', 'thick', 'thin', 'cat', 'cap', '고양이', 'Dailylife', 'animals'] WHERE title_id = '3939172d-c3fd-4a6b-a843-70885fe2b161';

-- 대형막내! (BIG maknae) - 11 keywords
UPDATE titles SET keywords = ARRAY['big', 'maknae', '대형막내', 'drama', 'emotional depth', 'character development', 'family drama', 'social issues', 'human condition', 'relationships', 'conflict'] WHERE title_id = '1480212e-f081-4c4e-8cfe-cfcb0a185e77';

-- 주작학원 (Jujak Academy) - 6 keywords
UPDATE titles SET keywords = ARRAY['jujak', 'academy', '주작학원', 'Drama', 'School', 'Action'] WHERE title_id = 'e1cc2346-690b-42d0-a8cc-46626ca8901e';

-- 멜랑꼴리 (Melancholy) - 4 keywords
UPDATE titles SET keywords = ARRAY['melancholy', '멜랑꼴리', 'Comedy', 'Episode'] WHERE title_id = '6cdb330e-962a-4393-83c3-83e480f37d48';

-- 데이 세이 헤이 (Day Say Hey) - 5 keywords
UPDATE titles SET keywords = ARRAY['day', 'say', 'hey', 'Dailylife', 'gags'] WHERE title_id = 'e5586b76-48bd-4266-a5bc-8a7856f4e7d1';

-- 조선팔도 최강아이돌 (Chosun SUPER Idol) - 6 keywords
UPDATE titles SET keywords = ARRAY['chosun', 'super', 'idol', '조선팔도', '최강아이돌', 'Romance'] WHERE title_id = '7ad07891-c1c2-4906-a738-c513032d4da7';

-- 희망횟집 (HOPE Restaurant) - 4 keywords
UPDATE titles SET keywords = ARRAY['hope', 'restaurant', '희망횟집', 'daily'] WHERE title_id = '5d96fc8b-2cd9-4991-932c-bbbb64dc6166';

-- 날라리 (Punk) - 13 keywords
UPDATE titles SET keywords = ARRAY['punk', '날라리', 'Romance', 'dailylife', 'drama', 'emotional depth', 'character development', 'family drama', 'social issues', 'human condition', 'relationships', 'conflict', 'school'] WHERE title_id = '3e2d4616-9d68-4dd1-818f-c7e9b304886b';

-- 사기캐 (Fraudulent character) - 15 keywords
UPDATE titles SET keywords = ARRAY['fraudulent', 'character', '사기캐', 'Fantasy', 'gag', 'boy', 'action', 'fight scenes', 'martial arts', 'explosions', 'chase sequences', 'weapons', 'combat', 'adrenaline', 'high stakes'] WHERE title_id = '3ff647e0-c228-45f7-b69b-9a58cff646ee';

-- 드리밍 (dreaming) - 4 keywords
UPDATE titles SET keywords = ARRAY['dreaming', '드리밍', 'Romance', 'Drama'] WHERE title_id = '9b03a165-8e7b-4980-b31b-0480ad72db7c';

-- 아는 사람 이야기 (Story Someone I Know) - 4 keywords
UPDATE titles SET keywords = ARRAY['story', 'someone', 'know', '이야기'] WHERE title_id = '898bad93-f228-4c60-bbc8-3e76e32f1dce';

-- 츄리닝 (Sweatsuit) - 4 keywords
UPDATE titles SET keywords = ARRAY['sweatsuit', '츄리닝', 'Dailylife', 'gags'] WHERE title_id = '233c75b7-381b-4008-94f7-6f1a1cf1af54';

-- 스마트폰 중독자 (smartphone addict) - 19 keywords
UPDATE titles SET keywords = ARRAY['smartphone', 'addict', '스마트폰', '중독자', 'Romance', 'gag', 'fantasy', 'magic', 'supernatural', 'mythical creatures', 'alternate world', 'prophecy', 'quest', 'powers', 'enchantment', 'story', 'growth', 'dailylife', 'school'] WHERE title_id = '5d97cc4a-3db0-47d0-b72c-e0ac2c327866';

-- 토끼는 숨죽여 울고 있었다 (Crying Rabbit) - 23 keywords
UPDATE titles SET keywords = ARRAY['crying', 'rabbit', '토끼는', '숨죽여', '있었다', 'horror', 'scary', 'supernatural horror', 'psychological horror', 'monsters', 'fear', 'dread', 'gore', 'jump scares', 'thriller', 'suspense', 'tension', 'mystery', 'danger', 'psychological', 'cat and mouse', 'edge of seat', 'plot twists'] WHERE title_id = '5b11cfe1-8b6b-4aa5-84ef-e84d44fce825';

-- 나비인간 (Butterfly Girl) - 11 keywords
UPDATE titles SET keywords = ARRAY['butterfly', 'girl', '나비인간', 'drama', 'emotional depth', 'character development', 'family drama', 'social issues', 'human condition', 'relationships', 'conflict'] WHERE title_id = 'fa6b49cb-6d07-42bc-b721-a8eb022e37f8';

-- Progress: 75/245 titles updated

-- 그림자 미녀 (Shadowy beauty) - 6 keywords
UPDATE titles SET keywords = ARRAY['shadowy', 'beauty', '그림자', 'Drama', 'story', 'growth'] WHERE title_id = '5830de5c-ddd5-43e7-945b-39b6d618588e';

-- 공유하는 집 (Share house) - 4 keywords
UPDATE titles SET keywords = ARRAY['house', 'share', '공유하는', 'Adult'] WHERE title_id = 'f8f42ab7-539a-4374-9aa1-196dbb1213b3';

-- 겁쟁이 피지컬 (Cowarldy physical) - 7 keywords
UPDATE titles SET keywords = ARRAY['war', 'cowarldy', 'physical', '겁쟁이', '피지컬', 'Boy', 'Action'] WHERE title_id = 'a173eaf9-9291-45fd-b855-98b4a3c08bb9';

-- 재밌니, 짝사랑 (Crush on You) - 7 keywords
UPDATE titles SET keywords = ARRAY['crush', '재밌니', '짝사랑', 'Romance', 'Drama', 'Growth', 'DailyLife'] WHERE title_id = '7af41cc7-e37f-434d-8733-06d2cbb7bff1';

-- 인간시장 (human market) - 6 keywords
UPDATE titles SET keywords = ARRAY['human', 'market', '인간시장', 'Drama', 'story', 'growth'] WHERE title_id = '6edf3ec4-9712-4609-afa8-a49236536d38';

-- 백합 하우스 (Lily house) - 5 keywords
UPDATE titles SET keywords = ARRAY['house', 'lily', '하우스', 'Drama', 'Thriller'] WHERE title_id = '4cd44cb2-2101-4820-8c0e-d55512746cbf';

-- 귀신과 연애하기 시뮬레이션 (Simulation of dating a ghost) - 12 keywords
UPDATE titles SET keywords = ARRAY['simulation', 'dating', 'ghost', '귀신과', '연애하기', '시뮬레이션', 'Romance', 'Drama', 'Fantasy', 'Exorcism', 'Horror', 'Campus'] WHERE title_id = 'e22a47ec-bdbd-49b5-affa-f6d6dc19e697';

-- 스마트 패밀리 (Smart Family) - 6 keywords
UPDATE titles SET keywords = ARRAY['family', 'smart', '스마트', '패밀리', 'Dailylife', 'gags'] WHERE title_id = '44508fe8-3a16-4476-aa7a-a7d61b49dc2a';

-- Luck 4 you (Luck 4 you) - 3 keywords
UPDATE titles SET keywords = ARRAY['luck', 'Fantasy', 'Drama'] WHERE title_id = 'abea79d7-2968-4731-81a8-408ff2ec2841';

-- 봄과 겨울 (spring and winter) - 4 keywords
UPDATE titles SET keywords = ARRAY['spring', 'winter', 'gag', 'school'] WHERE title_id = '9bc2dd9d-85da-4bb6-8fba-bb8ddc4359fd';

-- 우리는 매일매일 (We Are Everyday) - 4 keywords
UPDATE titles SET keywords = ARRAY['everyday', '우리는', '매일매일', 'Romance'] WHERE title_id = 'a8e7b2d7-3c18-4974-a5f4-a3b60e1bd7d4';

-- 반투명인간 (Half Invisible man) - 13 keywords
UPDATE titles SET keywords = ARRAY['half', 'invisible', 'man', '반투명인간', 'fantasy', 'magic', 'supernatural', 'mythical creatures', 'alternate world', 'prophecy', 'quest', 'powers', 'enchantment'] WHERE title_id = '50438720-6aff-44a8-9291-9af96c505342';

-- 페이트 (Fate) - 4 keywords
UPDATE titles SET keywords = ARRAY['fate', '페이트', 'Fantasy', 'Romance'] WHERE title_id = 'a6e684f9-81c2-4dae-93d5-8bdad69cbfd0';

-- 밀토담 (Miltodam) - 11 keywords
UPDATE titles SET keywords = ARRAY['miltodam', '밀토담', 'fantasy', 'magic', 'supernatural', 'mythical creatures', 'alternate world', 'prophecy', 'quest', 'powers', 'enchantment'] WHERE title_id = '355b1e2f-8343-411d-a4b9-18b5619e7184';

-- 영의 확률 (Zero probability) - 2 keywords
UPDATE titles SET keywords = ARRAY['zero', 'probability'] WHERE title_id = 'c208a5c6-4561-4561-bf22-8fdc4d7f09d6';

-- 우주를 9번 건너 (Cross the universe nine times.) - 28 keywords
UPDATE titles SET keywords = ARRAY['cross', 'universe', 'nine', 'times', '우주를', 'Gag', 'dailylife', 'fantasy', 'magic', 'supernatural', 'mythical creatures', 'alternate world', 'prophecy', 'quest', 'powers', 'enchantment', 'growth', 'story', 'romance', 'love story', 'romantic comedy', 'love triangle', 'relationship', 'marriage', 'dating', 'heartbreak', 'passion', 'school'] WHERE title_id = 'b6074733-b19d-4be5-8982-fb00a4743967';

-- 겨우내 (Throughout the winter) - 12 keywords
UPDATE titles SET keywords = ARRAY['throughout', 'winter', '겨우내', 'thriller', 'suspense', 'tension', 'mystery', 'danger', 'psychological', 'cat and mouse', 'edge of seat', 'plot twists'] WHERE title_id = '8fe72979-9520-4aef-9cf6-8daf2d238d85';

-- 도문대작 (Great materpiece) - 4 keywords
UPDATE titles SET keywords = ARRAY['great', 'materpiece', '도문대작', 'times'] WHERE title_id = '712f4c2c-eb9c-43e8-a17e-8306f2f6a6bc';

-- 나를 바꿔줘 (Change me) - 10 keywords
UPDATE titles SET keywords = ARRAY['change', '바꿔줘', 'drama', 'emotional depth', 'character development', 'family drama', 'social issues', 'human condition', 'relationships', 'conflict'] WHERE title_id = 'f6e2884a-cc11-4fdb-befd-a0a103c10ff3';

-- 마녀는 사랑하지 않아도 괜찮아요 (Witch Love Or Not) - 8 keywords
UPDATE titles SET keywords = ARRAY['love', 'witch', '마녀는', '사랑하지', '않아도', '괜찮아요', 'Romance', 'Wizard'] WHERE title_id = '2ade986d-b865-4ebf-9fdf-9de69e637a94';

-- 네임펜으로 그린 그림 (Namepen toon) - 20 keywords
UPDATE titles SET keywords = ARRAY['story', 'empathy', 'shown', 'cute', 'animals', 'make', 'main', 'characters', 'including', 'rabbit', 'woogi', 'turtle', 'boogi', 'charge', 'couple', 'namepen', 'toon', '네임펜으로', 'Empathy', 'dailylife'] WHERE title_id = 'f8ab4ed0-0f34-4719-8e3a-6d809c8fba50';

-- 죽은 자를 상대하는 방법 (Dealing The Dead) - 5 keywords
UPDATE titles SET keywords = ARRAY['dealing', 'dead', '상대하는', 'Thriller', 'Zombie'] WHERE title_id = '832ef502-8fd8-4a14-8153-67d17ba9170e';

-- 데드라이프 (Dead Life) - 11 keywords
UPDATE titles SET keywords = ARRAY['dead', 'life', '데드라이프', 'drama', 'emotional depth', 'character development', 'family drama', 'social issues', 'human condition', 'relationships', 'conflict'] WHERE title_id = 'a7048289-6758-479a-9ead-04d994e68cdd';

-- 우당탕탕 따식이 (Udangtangtang Ttasiki) - 8 keywords
UPDATE titles SET keywords = ARRAY['udangtangtang', 'ttasiki', '우당탕탕', '따식이', 'gag', 'boy', 'blackcomedy', 'crazy'] WHERE title_id = '3ee3366d-44d0-4e73-8ce8-12d88a74e9df';

-- 웽툰 시즌4 (Wooengtoon Season Four) - 6 keywords
UPDATE titles SET keywords = ARRAY['wooengtoon', 'season', 'four', '시즌4', 'Dailylife', 'gags'] WHERE title_id = '2ce2e835-cded-4814-94a5-16cec27dc7b6';

-- Progress: 100/245 titles updated

-- 전 여친 (Ex Girlfriend) - 2 keywords
UPDATE titles SET keywords = ARRAY['girlfriend', 'adult'] WHERE title_id = '85051896-1461-4f70-aabc-1c80d56e3ab0';

-- 애증과 애정사이 (Love Hate Relationship) - 15 keywords
UPDATE titles SET keywords = ARRAY['love', 'hate', 'relationship', '애증과', '애정사이', 'fantasy', 'magic', 'supernatural', 'mythical creatures', 'alternate world', 'prophecy', 'quest', 'powers', 'enchantment', 'adult'] WHERE title_id = '66c525b3-714a-44fc-a6cc-2c957669103f';

-- 전처와의 동거 (Ex wife) - 3 keywords
UPDATE titles SET keywords = ARRAY['wife', '전처와의', 'adult'] WHERE title_id = '6f32f256-66fc-4e52-a51e-08667d8ca280';

-- 나쁘니까 더 (Becoming Bad) - 13 keywords
UPDATE titles SET keywords = ARRAY['becoming', 'bad', '나쁘니까', 'Noblecomics', 'romance', 'love story', 'romantic comedy', 'love triangle', 'relationship', 'marriage', 'dating', 'heartbreak', 'passion'] WHERE title_id = 'bb2413a6-3b0b-4337-8657-d198f6ce7944';

-- Day Or Night (Day Or Night) - 14 keywords
UPDATE titles SET keywords = ARRAY['day', 'night', 'Fantasy', 'gag', 'boy', 'action', 'fight scenes', 'martial arts', 'explosions', 'chase sequences', 'weapons', 'combat', 'adrenaline', 'high stakes'] WHERE title_id = '8c815c51-703a-4fe8-843f-ca361d6ab033';

-- 텍미하이(Take me high) (Never Mind Darling) - 6 keywords
UPDATE titles SET keywords = ARRAY['never', 'mind', 'darling', '텍미하이take', 'high', 'Campus'] WHERE title_id = 'ca24ae13-3d5e-44c0-beb6-a28de258974d';

-- 무능한 아빠는 외계인 (My Alien Dad) - 7 keywords
UPDATE titles SET keywords = ARRAY['alien', 'dad', '무능한', '아빠는', '외계인', 'Drama', 'Growth'] WHERE title_id = '9cb9b2c7-f467-4a06-958c-b2a0e1daaa69';

-- 데모니악 (Demoniac) - 4 keywords
UPDATE titles SET keywords = ARRAY['demoniac', '데모니악', 'Thriller', 'exorcism'] WHERE title_id = '68e1664f-aee2-4818-b0b1-3619cd0353ce';

-- 내가 누구개 (Who am I) - 3 keywords
UPDATE titles SET keywords = ARRAY['누구개', 'Fantasy', 'Romance'] WHERE title_id = '2b9a0b42-815d-4c74-ada5-a9133020aa38';

-- 다 해줄게 (I'll do everything for you) - 5 keywords
UPDATE titles SET keywords = ARRAY['ill', 'everything', '해줄게', 'Adult', 'Drama'] WHERE title_id = '5f888974-7729-40b8-8cbf-b29867a5fcc5';

-- 처음부터 너였어 (It was you from the beginning) - 3 keywords
UPDATE titles SET keywords = ARRAY['beginning', '처음부터', '너였어'] WHERE title_id = '4de951fa-5b58-4018-bd6f-7644a4d1d37f';

-- 그래도 사랑해 (But I still love you) - 6 keywords
UPDATE titles SET keywords = ARRAY['love', 'still', '그래도', '사랑해', 'Romance', 'Drama'] WHERE title_id = '38be3224-5de7-4cf4-88b1-f19c06fa0088';

-- 네버마인드달링 (Never Mind Darling) - 5 keywords
UPDATE titles SET keywords = ARRAY['never', 'mind', 'darling', '네버마인드달링', 'Campus'] WHERE title_id = 'f296747b-d2d5-470b-b088-3e06394e38f6';

-- 홈파이브(HOME5) (HOME5) - 2 keywords
UPDATE titles SET keywords = ARRAY['home5', '홈파이브home5'] WHERE title_id = 'c4f90fb2-386f-41e4-8473-f35513ae10b3';

-- 루나 (Luna) - 3 keywords
UPDATE titles SET keywords = ARRAY['luna', 'Romance', 'Fantasy'] WHERE title_id = 'a2e8d360-b1c2-4215-8e62-a2562fd1624d';

-- 애착 인형 (stuffed_animals) - 3 keywords
UPDATE titles SET keywords = ARRAY['stuffed_animals', 'Romance', 'novel'] WHERE title_id = 'f84322f5-0d9a-442e-96be-2ea034f8f9b6';

-- 언무드셀라 (unmoodsella) - 10 keywords
UPDATE titles SET keywords = ARRAY['unmoodsella', '언무드셀라', 'drama', 'emotional depth', 'character development', 'family drama', 'social issues', 'human condition', 'relationships', 'conflict'] WHERE title_id = '4f183893-1133-419f-a032-6181472bd55f';

-- 끝과 시작 (End and Start) - 3 keywords
UPDATE titles SET keywords = ARRAY['end', 'start', 'Romance'] WHERE title_id = '779c58e0-c9e2-46b7-af7d-3e50ce4337d8';

-- 황금의 핸드메이커 (Handmaker The Gold) - 14 keywords
UPDATE titles SET keywords = ARRAY['handmaker', 'gold', '황금의', '핸드메이커', 'fantasy', 'magic', 'supernatural', 'mythical creatures', 'alternate world', 'prophecy', 'quest', 'powers', 'enchantment', 'boy'] WHERE title_id = '1feb1a55-4f43-47bd-aa3e-c07517d42cb8';

-- 꽃에 피는 봄 (Spring Blooming) - 4 keywords
UPDATE titles SET keywords = ARRAY['spring', 'blooming', 'Fantasy', 'Romance'] WHERE title_id = 'd28323a7-f9a1-4952-b5c7-4638b80bc6bd';

-- 미래 남편 누구게? (Guess who my future husband is.) - 5 keywords
UPDATE titles SET keywords = ARRAY['future', 'guess', 'husband', '누구게', 'Romance'] WHERE title_id = '5bdc4ceb-567a-4392-b709-7b3702f92319';

-- 러브 앤 위시 (love&wish) - 3 keywords
UPDATE titles SET keywords = ARRAY['love', 'lovewish', 'Romance'] WHERE title_id = '6e8ce121-c45d-46ad-8a31-2d0c6e0c592d';

-- 남자친구를 조심해 (Watch out for your boyfriend) - 5 keywords
UPDATE titles SET keywords = ARRAY['watch', 'boyfriend', '남자친구를', '조심해', 'Romance'] WHERE title_id = 'aeffb805-0027-4a82-9942-b2672094e268';

-- 악마와 계약연애 (Devil Number 4) - 6 keywords
UPDATE titles SET keywords = ARRAY['devil', 'number', '악마와', '계약연애', 'Romance', 'Fantasy'] WHERE title_id = '44aaf592-1ae9-43d9-b4c5-928c88a1dc94';

-- 럭키고 해피 (Lucky Go Happy) - 4 keywords
UPDATE titles SET keywords = ARRAY['lucky', 'happy', '럭키고', 'daily'] WHERE title_id = '6e649cfc-8b60-4e12-84a9-dfd4806977b1';

-- Progress: 125/245 titles updated

-- 트라우마 (The Trauma) - 4 keywords
UPDATE titles SET keywords = ARRAY['trauma', '트라우마', 'Gags', 'cutcartoons'] WHERE title_id = '27d56b6c-bca0-434c-a22f-b0e928538afc';

-- NPC (NPC) - 11 keywords
UPDATE titles SET keywords = ARRAY['npc', 'gag', 'fantasy', 'magic', 'supernatural', 'mythical creatures', 'alternate world', 'prophecy', 'quest', 'powers', 'enchantment'] WHERE title_id = '683fe818-b1b4-4bf2-b737-0240823fedf9';

-- Disobey the Duke if You Dare (Disobey the Duke if You Dare) - 12 keywords
UPDATE titles SET keywords = ARRAY['youtube', 'trailer', 'disobey', 'duke', 'dare', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '1f76f392-fd3b-4e51-9aec-266c2c0bfdf3';

-- Mokrin (Mokrin) - 14 keywords
UPDATE titles SET keywords = ARRAY['island', 'wonderful', 'world', 'explore', 'romantic', 'epic', 'mokrin', 'HISTORICAL', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '2ba01662-71b0-4fe6-930e-be4bd271ea4e';

-- Punch Drunk Love (Punch Drunk Love) - 12 keywords
UPDATE titles SET keywords = ARRAY['love', 'like', 'punch', 'face', 'drunk', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '2448b5ea-8222-4bd7-a559-30d194f9d322';

-- Shoot for the Stars (Shoot for the Stars) - 15 keywords
UPDATE titles SET keywords = ARRAY['future', 'k-pop', 'seeing', 'stats', 'knowing', 'romance', 'shoot', 'stars', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '4364b5c6-4789-4c58-8d78-0cb639895d83';

-- Falling for Danger (Falling for Danger) - 15 keywords
UPDATE titles SET keywords = ARRAY['dramatic', 'action', 'thriller', 'hint', 'comedy', 'romance', 'falling', 'danger', 'DRAMA', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'd6cdcc3a-b7a0-446b-97e0-1310d672c6aa';

-- Lady Devil (Lady Devil) - 11 keywords
UPDATE titles SET keywords = ARRAY['youtube', 'trailer', 'lady', 'devil', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '36805404-d0ff-4775-8400-3f009f714f3c';

-- Paljae, Child of Winter (Paljae, Child of Winter) - 14 keywords
UPDATE titles SET keywords = ARRAY['love', 'journey', 'chronicles', 'epic', 'paljae', 'child', 'winter', 'PERIOD', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '3803fd38-2cd9-4612-bed3-c962d82ed2e7';

-- Goodbye, Dieting! (Goodbye, Dieting!) - 13 keywords
UPDATE titles SET keywords = ARRAY['first-person', 'documentary', 'dieting', 'body', 'image', 'goodbye', 'DRAMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'dbbf1602-011e-41ca-b576-4267c1fdd272';

-- Bongchon Bride (Bongchon Bride) - 12 keywords
UPDATE titles SET keywords = ARRAY['love', 'unlikely', 'story', 'bongchon', 'bride', 'PERIOD', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'd13ddbe1-ffe6-46de-91f7-bce685d867bf';

-- Heartrate Presto (Heartrate Presto) - 12 keywords
UPDATE titles SET keywords = ARRAY['music', 'passion', 'collide', 'heartrate', 'presto', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'e1d472ae-8b9e-48c2-a47c-919fa910765a';

-- Countdown to Love (Countdown to Love) - 15 keywords
UPDATE titles SET keywords = ARRAY['high concept', 'high', 'concept', 'elevating', 'gay', 'romance', 'love', 'countdown', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '935651fe-d70c-40d1-a923-449b51b0f335';

-- The Fallen Duke & the Knight Who Hated Him (The Fallen Duke & the Knight Who Hated Him) - 14 keywords
UPDATE titles SET keywords = ARRAY['sleeping', 'enemy', 'literally', 'fallen', 'duke', 'knight', 'hated', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '51aace45-4ee7-466a-b874-b8887fc4e67d';

-- The Blood Moon (The Blood Moon) - 12 keywords
UPDATE titles SET keywords = ARRAY['fresh', 'take', 'vampires', 'blood', 'moon', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '38198638-610d-4eaa-a7f0-941cdd8b3d77';

-- The Noble Pirate (The Noble Pirate) - 16 keywords
UPDATE titles SET keywords = ARRAY['one', 'top', 'webcomic', 'titles', 'japan', 'piccoma', 'platform', 'noble', 'pirate', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '84e964e0-ea66-491c-b7ad-863e55740176';

-- My Father is a Tyrant (My Father is a Tyrant) - 11 keywords
UPDATE titles SET keywords = ARRAY['wild', 'isekai', 'father', 'tyrant', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'f1de96cf-27a9-4470-85d4-3f484ef8b30c';

-- Under the Oak Tree (Under the Oak Tree) - 11 keywords
UPDATE titles SET keywords = ARRAY['youtube', 'trailer', 'oak', 'tree', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '5e387f06-473d-468c-a49e-6c81c1abd8fa';

-- Sangyang: The Wanderer (Sangyang: The Wanderer) - 16 keywords
UPDATE titles SET keywords = ARRAY['crime', 'lgbtq', 'romance', 'blended', 'action', 'thriller', 'elements', 'sangyang', 'wanderer', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '0fd314ba-6041-41fd-a9dd-6624eec61e26';

-- The Dilettante (The Dilettante) - 15 keywords
UPDATE titles SET keywords = ARRAY['crime', 'spicy', 'romance', 'contrasted', 'elmore', 'leonard-style', 'thriller', 'dilettante', 'THRILLER', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'f6b4fb66-9baf-4e71-a5fb-adae0b7eccc3';

-- My Miraculous Bookstore (My Miraculous Bookstore) - 12 keywords
UPDATE titles SET keywords = ARRAY['sweet', 'coming-of-age', 'story', 'miraculous', 'bookstore', 'YADRAMA', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'e87ca7b0-976c-44c8-84be-898611bd62ff';

-- My Super-Granny (My Super-Granny) - 11 keywords
UPDATE titles SET keywords = ARRAY['multi-generational', 'heartfelt', 'comedy', 'super-granny', 'COMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'edf7ca87-86ab-44a8-b6e8-8dc16c0414d2';

-- I Work at a Witch's Mansion (I Work at a Witch's Mansion) - 18 keywords
UPDATE titles SET keywords = ARRAY['supernatural', 'soapy', 'story', 'combines', 'playful', 'aesthetic', 'spooky', 'atmosphere', 'work', 'witchs', 'mansion', 'SUPERNATURAL', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '7077d89f-23ec-4ccd-9f20-57c0a30bffe3';

-- The Accidental Heiress (The Accidental Heiress) - 15 keywords
UPDATE titles SET keywords = ARRAY['rivals', 'love', 'becomes', 'lovers', 'fight', 'inheritance', 'accidental', 'heiress', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '594d0196-8d77-4f82-86f7-7ef645338c17';

-- Lies Become You (Lies Become You) - 11 keywords
UPDATE titles SET keywords = ARRAY['youtube', 'trailer', 'lies', 'become', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '4228f2c9-9391-4214-8b28-5c020ba23d55';

-- Progress: 150/245 titles updated

-- Love Order (Love Order) - 13 keywords
UPDATE titles SET keywords = ARRAY['love', 'food', 'symbolic', 'words', 'inadequate', 'order', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'bd85ea2c-f854-4b46-99ae-a1c180e1fcc3';

-- I Raised a Black Dragon (I Raised a Black Dragon) - 17 keywords
UPDATE titles SET keywords = ARRAY['hero', 'heroine', 'fate', 'outcast', 'must', 'raise', 'dragon', 'changing', 'raised', 'black', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '5e1bca6c-cd21-4450-834e-4379d59809dd';

-- May God Bless Your Demise (May God Bless Your Demise) - 14 keywords
UPDATE titles SET keywords = ARRAY['mystery', 'twist', 'memory-loss', 'romantic', 'god', 'bless', 'demise', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'bfd26f1e-acae-46f8-99d9-154699fcd178';

-- The Tale of the Frost Flower (The Tale of the Frost Flower) - 15 keywords
UPDATE titles SET keywords = ARRAY['love', 'imperial', 'scandal', 'shattered', 'first', 'tale', 'frost', 'flower', 'HISTORICAL', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '2613fd45-ca78-406a-8d11-3580326d1ea2';

-- Flip Turn (Flip Turn) - 14 keywords
UPDATE titles SET keywords = ARRAY['sport', 'dating', 'famous', 'sports', 'romance', 'flip', 'turn', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'bec9732b-0781-4eaf-b23c-caba7d10c874';

-- Cold-Blooded Beast (Cold-Blooded Beast) - 13 keywords
UPDATE titles SET keywords = ARRAY['supernatural', 'thriller', 'lgbtq', 'leads', 'cold-blooded', 'beast', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'fe0ac154-f343-4943-b297-e7b103c4a723';

-- Winter Wolf (Winter Wolf) - 13 keywords
UPDATE titles SET keywords = ARRAY['love', 'safe', 'fall', 'stranger', 'winter', 'wolf', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'c0fc47fb-3461-42fd-bcb3-b210000fbc18';

-- The Demon Queen Has a Death Wish (The Demon Queen Has a Death Wish) - 15 keywords
UPDATE titles SET keywords = ARRAY['romance', 'fantasy', 'breaks', 'rules', 'demon', 'queen', 'death', 'wish', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '3e08c59e-ea2d-4a86-ab5e-d8404108254b';

-- Princess of the Animals (Princess of the Animals) - 16 keywords
UPDATE titles SET keywords = ARRAY['one', 'top', 'webcomic', 'titles', 'japan', 'piccoma', 'platform', 'princess', 'animals', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '50d1ae46-2888-47b2-9f4f-b8075752cc9a';

-- The Summer of Penguins (The Summer of Penguins) - 14 keywords
UPDATE titles SET keywords = ARRAY['survival', 'adventure', 'nature', 'survivalist', 'thriller', 'summer', 'penguins', 'DRAMA', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'ebf9e63c-af25-48fe-b44b-3a4a4949cf46';

-- If I Were You (If I Were You) - 21 keywords
UPDATE titles SET keywords = ARRAY['contemporary', 'sliding', 'doors', 'drama', 'easily', 'adapted', 'focus', 'american', 'girls', 'different', 'economic', 'classes', 'swapping', 'lives', 'DRAMA', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'e96690d8-4ea8-4b6a-919a-bb455a4762d5';

-- Happiness Starts at Home (Happiness Starts at Home) - 16 keywords
UPDATE titles SET keywords = ARRAY['friends', 'city', 'gen', 'take', 'four', 'living', 'happiness', 'starts', 'home', 'COMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '81f2b150-6c1a-4224-90ac-6a8437e873b1';

-- Devil at the Crossroads (Devil at the Crossroads) - 21 keywords
UPDATE titles SET keywords = ARRAY['supernatural', 'adventure', 'quirky', 'comedy', 'perfect', 'animated', 'adult', 'live', 'action', 'grounded', 'adds', 'fun', 'devil', 'crossroads', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '0cfbbe46-e4b3-4d29-925a-a5e9e88bcdab';

-- The Fantastical After-School Writing Club (The Fantastical After-School Writing Club) - 16 keywords
UPDATE titles SET keywords = ARRAY['genuinely', 'hilarious', 'genre-bending', 'romcom', 'school', 'fantastical', 'after-school', 'writing', 'club', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'b1798def-906c-4bcc-91ec-030e661ce914';

-- Werewolves Going Crazy Over Me (Werewolves Going Crazy Over Me) - 18 keywords
UPDATE titles SET keywords = ARRAY['supernatural', 'medical', 'drama', 'mixed', 'soap', 'truly', 'original', 'idea', 'werewolves', 'going', 'crazy', 'SUPERNATURAL', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '1813044e-306f-4479-87cb-bb212b502e1f';

-- Miss You, Lucifer (Miss You, Lucifer) - 14 keywords
UPDATE titles SET keywords = ARRAY['gay', 'romp', 'dives', 'vagaries', 'fame', 'miss', 'lucifer', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '89aae928-36d3-410d-b546-7badd0312418';

-- My Sweet Enemy, Thy Name is Husband (My Sweet Enemy, Thy Name is Husband) - 17 keywords
UPDATE titles SET keywords = ARRAY['enemies', 'love', 'ultimate', 'enemies-to-lovers', 'romance', 'sweet', 'enemy', 'thy', 'name', 'husband', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '14f3aa3a-b481-40bf-88ad-dcb3f06a451c';

-- Even If... (Even If...) - 28 keywords
UPDATE titles SET keywords = ARRAY['love', 'crime', 'hes', 'using', 'kill', 'brother', 'brothers', 'actions', 'led', 'death', 'sister', 'callous', 'lie', 'turns', 'truly', 'one', 'compelling', 'dynamic', 'soapy', 'thrillers', 'even', 'THRILLER', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'b8f1367c-94a7-41a2-baf6-a8ac974584ef';

-- My Second Life as an Idol (My Second Life as an Idol) - 28 keywords
UPDATE titles SET keywords = ARRAY['k-pop', 'exploding', 'globally', 'wish-fulfillment', 'story', 'takes', 'audiences', 'heart', 'washed', 'never', 'dies', 'put', 'body', 'younger', 'hopeful', 'heaven', 'wait', 'style', 'second', 'life', 'idol', 'GROUNDEDFANTASYK-POPDRAMA', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'a254b69c-b1d4-4c54-acac-723be6cf8b7e';

-- Being Me, Being You (Being Me, Being You) - 9 keywords
UPDATE titles SET keywords = ARRAY['self-discovery', 'story', 'DRAMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'cae9e60c-e7d6-4a96-acb4-f29687a980b0';

-- NPCs Can Save the World Too! (NPCs Can Save the World Too!) - 14 keywords
UPDATE titles SET keywords = ARRAY['tutorial', 'npc', 'here', 'save', 'day', 'npcs', 'world', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '83927eac-40f0-4816-8d36-f717d353a30d';

-- Reborn as the Enemy Prince (Reborn as the Enemy Prince) - 14 keywords
UPDATE titles SET keywords = ARRAY['remove', 'imagine', 'kin', 'sworn', 'enemy', 'reborn', 'prince', 'ACTION', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '6afd8eaf-569d-4227-9183-a9d39d0f3916';

-- I Became a Doting Father (I Became a Doting Father) - 24 keywords
UPDATE titles SET keywords = ARRAY['parents', 'sweet', 'soapy', 'story', 'appeals', 'younger', 'people', 'based', 'factor', 'watching', 'young', 'lead', 'struggle', 'parenthood', 'became', 'doting', 'father', 'COMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '6a0a8bea-10be-486e-89ee-34177828e19b';

-- Getting Along Just Fine (Getting Along Just Fine) - 15 keywords
UPDATE titles SET keywords = ARRAY['motherdaughter', 'story', 'heart', 'humor', 'getting', 'along', 'just', 'fine', 'COMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '45c1ce60-08ef-4029-864e-1fb8c3fa3e80';

-- The Redemption of Earl Nottingham (The Redemption of Earl Nottingham) - 15 keywords
UPDATE titles SET keywords = ARRAY['fate', 'curse', 'madelyns', 'cursed', 'husbands', 'redemption', 'earl', 'nottingham', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '6ff53693-d898-4311-be5a-ff819d34812f';

-- Progress: 175/245 titles updated

-- The Duke's Fake Sister (The Duke's Fake Sister) - 16 keywords
UPDATE titles SET keywords = ARRAY['identity', 'secret', 'wild', 'secret-identity', 'romance', 'fantasy', 'dukes', 'fake', 'sister', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '4a834f17-ac0c-430c-a2df-0e0a61f6724c';

-- Finding Camellia (Finding Camellia) - 15 keywords
UPDATE titles SET keywords = ARRAY['youtube', 'trailer', 'finding', 'camellia', 'novel', 'available', 'manta', 'app', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'ea2167ba-3d89-4c09-979c-1d5114bfcb19';

-- When Fate Finds Us (When Fate Finds Us) - 16 keywords
UPDATE titles SET keywords = ARRAY['love', 'fate', 'twist', 'fantasy', 'epic', 'twisted', 'fates', 'forbidden', 'finds', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'add27af2-1cf2-4f31-ab6c-fdb4842aa577';

-- Love Lies (Love Lies) - 14 keywords
UPDATE titles SET keywords = ARRAY['fake', 'dating', 'koreas', 'hottest', 'star', 'love', 'lies', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'd5b4a1d0-7b4b-40f2-83d4-de6bcef08fe7';

-- Isnelda (Isnelda) - 12 keywords
UPDATE titles SET keywords = ARRAY['hero', 'love', 'isnelda', 'stuck', 'first', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '4bd3a7a3-40a1-4cde-ab2f-8d52dd39cca2';

-- You Get Me Going (You Get Me Going) - 13 keywords
UPDATE titles SET keywords = ARRAY['spritely', 'lgbtq', 'workplace', 'romance', 'get', 'going', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'a221dad3-93ba-4a6c-b9bd-cab11af10cb0';

-- The Devil and His Sacrifice (The Devil and His Sacrifice) - 12 keywords
UPDATE titles SET keywords = ARRAY['love', 'bloom', 'wasteland', 'sacrifice', 'devil', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '75f3dd37-4111-494f-b451-dc3c22ed6803';

-- Wish Upon a Husband (Wish Upon a Husband) - 31 keywords
UPDATE titles SET keywords = ARRAY['contemporary', 'high concept', 'hilarious', 'high', 'concept', 'statue', 'coming', 'life', 'perfect', 'suitor', 'woman', 'scorned', 'although', 'comic', 'set', 'nebulous', 'period', 'setting', 'easy', 'make', 'story', 'wish', 'upon', 'husband', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'bf9f9e26-bc41-41e8-ad46-66b4fde2d5c6';

-- Cheolsu Saves the World (Cheolsu Saves the World) - 20 keywords
UPDATE titles SET keywords = ARRAY['time travel', 'time', 'travel', 'prevent', 'apocalypse', 'massive', 'stakes', 'great', 'everyman', 'lead', 'cheolsu', 'saves', 'world', 'SCI-FI', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '17e1a427-1083-482b-85ae-e3258be98efd';

-- My Master, My Prince (My Master, My Prince) - 12 keywords
UPDATE titles SET keywords = ARRAY['love', 'richpoor', 'story', 'master', 'prince', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '91068599-1dc8-4ceb-b173-3ff20cc15d9a';

-- Opposites Attract (Opposites Attract) - 12 keywords
UPDATE titles SET keywords = ARRAY['love', 'overcome', 'incompatibility', 'opposites', 'attract', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '2b9ca011-a6ac-4c84-a9c5-0c6960900c57';

-- The Flower of Veneration (The Flower of Veneration) - 13 keywords
UPDATE titles SET keywords = ARRAY['lady', 'vengeance', 'returned', 'prince', 'flower', 'veneration', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '7d626b88-c82c-481f-bbf9-a205a69806bc';

-- Falling for a Dying Princess (Falling for a Dying Princess) - 13 keywords
UPDATE titles SET keywords = ARRAY['love', 'dying', 'princess', 'knight', 'loves', 'falling', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'b4b35705-6d22-40e7-84dc-b94d217542cb';

-- Arpeggio on the Surface of the Sea (Arpeggio on the Surface of the Sea) - 14 keywords
UPDATE titles SET keywords = ARRAY['college', 'romance', 'light', 'romantic', 'arpeggio', 'surface', 'sea', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '3fa4a863-1492-4a97-a944-cab61b3c73c4';

-- Reunion (Reunion) - 11 keywords
UPDATE titles SET keywords = ARRAY['identity', 'secret', 'aspirational', 'reunion', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'ffd5d491-428f-46c5-b9c5-7e806f10dee7';

-- Stigmata (Stigmata) - 13 keywords
UPDATE titles SET keywords = ARRAY['magic', 'isekai', 'stunning', 'magical', 'world', 'stigmata', 'PERIOD', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '8d61f202-9b3e-4d7e-a5de-e1a7a2981251';

-- Betrayal of Dignity (Betrayal of Dignity) - 16 keywords
UPDATE titles SET keywords = ARRAY['romance', 'societal', 'rules', 'straight', 'edith', 'wharton', 'novel', 'betrayal', 'dignity', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '2bb88b2a-599b-454a-9cf5-9b084c1dbe87';

-- Bittersweet Con Panna (Bittersweet Con Panna) - 13 keywords
UPDATE titles SET keywords = ARRAY['sweet', 'lesbian', 'romance', 'bittersweet', 'con', 'panna', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '89067fe7-b3aa-49b6-aecd-e66c189f3ba9';

-- I've Become a True Villainess (I've Become a True Villainess) - 23 keywords
UPDATE titles SET keywords = ARRAY['hero', 'heroine', 'love', 'reincarnated', 'navigates', 'dangerous', 'triangle', 'doing', 'anything', 'survive', 'matter', 'villain', 'ive', 'become', 'true', 'villainess', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '43937bbd-be21-4ae4-a141-cbdf695f91c2';

-- Justice Now! (Justice Now!) - 10 keywords
UPDATE titles SET keywords = ARRAY['fighting', 'system', 'justice', 'COMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '82747af4-f8a8-4bb1-af1e-f5e8ac793801';

-- The Forgotten Princess Just Wants Peace (The Forgotten Princess Just Wants Peace) - 23 keywords
UPDATE titles SET keywords = ARRAY['romance', 'fantasy', 'turns', 'wish-fulfillment', 'aspect', 'genre', 'head', 'focusing', 'princess', 'doesnt', 'want', 'royalty', 'forgotten', 'just', 'wants', 'peace', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'd3d999f8-bded-4692-9df0-5665353b0268';

-- Duchess Crow (Duchess Crow) - 13 keywords
UPDATE titles SET keywords = ARRAY['power', 'empowered', 'female', 'lead', 'duchess', 'crow', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '8e32a092-7d01-4307-afad-302a9a0f098b';

-- Nowhere But Iceland (Nowhere But Iceland) - 14 keywords
UPDATE titles SET keywords = ARRAY['magic', 'magical', 'comedy', 'travel', 'reinvention', 'nowhere', 'iceland', 'FANTASTICAL', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '805e7c66-1868-44b6-ac50-ec6f06bc2c79';

-- The Script (The Script) - 11 keywords
UPDATE titles SET keywords = ARRAY['wuxia-infused', 'romance', 'fantasy', 'script', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'cbb957fc-cf21-434d-a0a1-64a44c08bc8b';

-- [ blank。] ([ blank。]) - 15 keywords
UPDATE titles SET keywords = ARRAY['high concept', 'great', 'grounded', 'high', 'concept', 'erotic', 'thriller', 'blank', 'THRILLER', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '66760b36-fdda-49cd-8720-f855384d5505';

-- Progress: 200/245 titles updated

-- Terrarium Adventure (Terrarium Adventure) - 20 keywords
UPDATE titles SET keywords = ARRAY['survival', 'game', 'videogame', 'adaptations', 'hotter', 'ever', 'story', 'female', 'lead', 'caught', 'fighting', 'adventure', 'terrarium', 'SF/ACTIONADVENTURE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '6b35e586-4082-4cac-a7a5-48612df05144';

-- The Secret of Umbra (The Secret of Umbra) - 22 keywords
UPDATE titles SET keywords = ARRAY['mystery', 'supernatural', 'international appeal', 'impressive', 'blend', 'romance', 'elements', 'intriguing', 'setting', 'adds', 'atmosphere', 'international', 'appeal', 'secret', 'umbra', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '122ad9a1-1626-4c18-b9f7-6b3b8e250def';

-- Whispers Through the Willows (Whispers Through the Willows) - 13 keywords
UPDATE titles SET keywords = ARRAY['prince', 'falls', 'beautiful', 'lie', 'whispers', 'willows', 'SCI-FI', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '8db1c816-4ece-43fa-8cac-4f831864fd1d';

-- Evangeline's Sword (Evangeline's Sword) - 14 keywords
UPDATE titles SET keywords = ARRAY['adventure', 'action', 'elevate', 'romance', 'fantasy', 'evangelines', 'sword', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'c28790d7-6d69-4eb9-b2d0-c4805d9d1a77';

-- Fry My Life (Fry My Life) - 14 keywords
UPDATE titles SET keywords = ARRAY['workplace', 'comedy', 'fun', 'conspiratorial', 'engine', 'fry', 'life', 'COMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'ebf5e1d4-6aa2-4784-952e-85e8f80502ab';

-- The Quant of Wall Street (The Quant of Wall Street) - 12 keywords
UPDATE titles SET keywords = ARRAY['docuseries', 'investment', 'quant', 'wall', 'street', 'NONFICTION', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '3674b0c3-777e-4cfc-bb34-7a94b0e84eb3';

-- My Husband, My Sister, and I (My Husband, My Sister, and I) - 11 keywords
UPDATE titles SET keywords = ARRAY['youtube', 'trailer', 'husband', 'sister', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'ad2aeb6b-831d-4c8a-9f14-ce27ece2f421';

-- Restoring Art and Love (Restoring Art and Love) - 14 keywords
UPDATE titles SET keywords = ARRAY['high', 'art', 'human', 'heart', 'collide', 'love', 'restoring', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'f7d326fe-6264-4718-80bf-500094f4d0ad';

-- Stand Up, Now! (Stand Up, Now!) - 12 keywords
UPDATE titles SET keywords = ARRAY['first-person', 'narrative', 'world', 'stand-up', 'stand', 'NONFICTION', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'fed7124b-52e8-4a3f-a4bb-2bb3d33083f4';

-- Stone House on Jeju Island (Stone House on Jeju Island) - 15 keywords
UPDATE titles SET keywords = ARRAY['romantic', 'romp', 'inspiring', 'place', 'house', 'island', 'stone', 'jeju', 'ROMANTIC', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '06067d4e-358f-4868-8427-d9011fe89924';

-- Flash Behavior (Flash Behavior) - 14 keywords
UPDATE titles SET keywords = ARRAY['love', 'yuli', 'save', 'world', 'life', 'flash', 'behavior', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'e9d4369a-6e36-449e-8b56-bfb33232f72c';

-- A Zero Waste Life (A Zero Waste Life) - 13 keywords
UPDATE titles SET keywords = ARRAY['comedy', 'important', 'issue', 'zero', 'waste', 'life', 'COMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'c5625f30-29f8-4715-9064-2b2e8bdf7c64';

-- Let's Get You Better (Let's Get You Better) - 13 keywords
UPDATE titles SET keywords = ARRAY['love', 'strange', 'story', 'lets', 'get', 'better', 'ROMANTICTHRILLER', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '16303045-b90d-4455-a290-c366326f61ee';

-- Tendering Resignation (Tendering Resignation) - 15 keywords
UPDATE titles SET keywords = ARRAY['crime', 'perfect', 'blend', 'thriller', 'lesbian', 'romance', 'tendering', 'resignation', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '8fcb37a5-da39-4f25-84dc-14ab30d31531';

-- Women's Soccer (Women's Soccer) - 12 keywords
UPDATE titles SET keywords = ARRAY['power', 'girlpower', 'soccer', 'win', 'womens', 'COMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '64148d92-d8be-4b77-8091-8b47da5fbeac';

-- Go, Haechi, Go! (Go, Haechi, Go!) - 10 keywords
UPDATE titles SET keywords = ARRAY['k-content', 'kids', 'haechi', 'KIDS', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'd135f597-700f-45e7-a98a-0cb312949f8f';

-- The Woodsman and the Stag (The Woodsman and the Stag) - 15 keywords
UPDATE titles SET keywords = ARRAY['love', 'mythological', 'worldbuilding', 'adds', 'interest', 'story', 'woodsman', 'stag', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '2413e8f0-34ef-4bf2-b3fc-6ef27ff6fd96';

-- From Bread to Closets (From Bread to Closets) - 15 keywords
UPDATE titles SET keywords = ARRAY['fresh', 'new', 'take', 'odd', 'couple', 'dynamic', 'bread', 'closets', 'COMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'd06b1821-b77b-4cb0-89df-b2f840cfd849';

-- Traces of the Sun (Traces of the Sun) - 18 keywords
UPDATE titles SET keywords = ARRAY['modern', 'high concept', 'compelling', 'high', 'concept', 'fantasy', 'intrusions', 'disrupting', 'world', 'traces', 'sun', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '11b3fd88-14e4-4785-a0ad-d54cb7afaa8e';

-- Science Tikitaka (Science Tikitaka) - 13 keywords
UPDATE titles SET keywords = ARRAY['fun', 'visual', 'accessible', 'science', 'show', 'tikitaka', 'NONFICTION', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '7e9146e4-1b36-4c5b-ab28-4af4ead2afd5';

-- 4 Week Lovers (4 Week Lovers) - 18 keywords
UPDATE titles SET keywords = ARRAY['one', 'top', 'titles', 'across', 'southeast', 'asia', 'comico', 'platform', 'love', 'week', 'lovers', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '91811177-7588-420a-9352-79a21ab7a978';

-- I Lived in a Shelter (I Lived in a Shelter) - 14 keywords
UPDATE titles SET keywords = ARRAY['heartfelt', 'story', 'important', 'social', 'issue', 'lived', 'shelter', 'DRAMA', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'aaad6b04-793a-45be-918c-1f4644d29be5';

-- Observing Elena Evoy (Observing Elena Evoy) - 12 keywords
UPDATE titles SET keywords = ARRAY['youtube', 'trailer', 'observing', 'elena', 'evoy', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'bed5c9a5-bf82-4413-9d6e-fed9343cc281';

-- Juliet, We're Not in Kansas Anymore! (Juliet, We're Not in Kansas Anymore!) - 23 keywords
UPDATE titles SET keywords = ARRAY['school', 'love', 'course', 'true', 'never', 'run', 'smooth', 'especially', 'high', 'girl', 'tragically', 'romantic', 'name', 'juliet', 'kansas', 'anymore', 'HIGHCONCEPT', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'c87644c8-1cfd-4c95-b8e3-eb48a131f277';

-- The Superheroes of Class F (The Superheroes of Class F) - 27 keywords
UPDATE titles SET keywords = ARRAY['hero', 'comedy', 'fun', 'obsession', 'superheroes', 'selected', 'one', 'titles', 'presented', 'asian', 'contents', 'film', 'market', 'busan', 'story', 'held', 'week', 'festival', 'october', 'class', 'ACTION', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '4a8f9233-e9fb-4dfd-b0e1-14fb50800bf1';

-- Progress: 225/245 titles updated

-- The Many Seasons of Food (The Many Seasons of Food) - 14 keywords
UPDATE titles SET keywords = ARRAY['countryside', 'delicious', 'joys', 'living', 'many', 'seasons', 'food', 'ROM-COM', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'b5c4e3a5-1f6e-4f46-b099-eb80aa94f7da';

-- Shall We Bathe, Your Grace? (Shall We Bathe, Your Grace?) - 23 keywords
UPDATE titles SET keywords = ARRAY['quest', 'hilarious', 'spoof', 'fairytale', 'stories', 'asking', 'obvious', 'question', 'must', 'bath-adverse', 'royals', 'smell', 'like', 'shall', 'bathe', 'grace', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'be36df58-80e1-44de-a51e-0498435821d9';

-- Call Me Master (Call Me Master) - 17 keywords
UPDATE titles SET keywords = ARRAY['power', 'memory', 'loss', 'dynamics', 'add', 'spice', 'romance', 'fantasy', 'call', 'master', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '484203bf-5148-413d-b93e-84ba50166d9a';

-- Homo Plastikos (Homo Plastikos) - 18 keywords
UPDATE titles SET keywords = ARRAY['eco-horror', 'zombie', 'plastikos', 'lust', 'plastic', 'still', 'deadly', 'flesh', 'blood', 'people', 'homo', 'SCI-FI', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'e388e37f-7a11-4ca4-8164-15339c6bfda4';

-- Rewriting My Tragic Ending (Rewriting My Tragic Ending) - 17 keywords
UPDATE titles SET keywords = ARRAY['protagonist', 'fantasy world', 'take-charge', 'female', 'exciting', 'fantasy', 'world', 'rewriting', 'tragic', 'ending', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '9e74881a-4a33-4d1e-b8ee-ae4be165fbcb';

-- I Can See Your Stats! (I Can See Your Stats!) - 14 keywords
UPDATE titles SET keywords = ARRAY['love', 'estate', 'manage', 'lover', 'tame', 'see', 'stats', 'PERIOD', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '06a6ac30-0b8b-49c6-9b37-e9e02ed99537';

-- The Deviless' Impression of a Princess (The Deviless' Impression of a Princess) - 14 keywords
UPDATE titles SET keywords = ARRAY['bad', 'girl', 'make', 'good', 'deviless', 'impression', 'princess', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '2bd0068c-8a26-46d3-843a-8fe4b4e049e8';

-- Zodiac Hunters (Zodiac Hunters) - 13 keywords
UPDATE titles SET keywords = ARRAY['supernatural', 'fun', 'zany', 'action', 'zodiac', 'hunters', 'SUPERNATURAL', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'c4e6c20c-d946-4497-872c-227aaf3dfce0';

-- Trophy Husband (Trophy Husband) - 16 keywords
UPDATE titles SET keywords = ARRAY['power', 'empowered', 'female', 'lead', 'finds', 'perfect', 'himbo', 'trophy', 'husband', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '70eea124-ce24-4a44-b9c2-5ebcae7bacc2';

-- Your Eternal Lies (Your Eternal Lies) - 14 keywords
UPDATE titles SET keywords = ARRAY['justice', 'crime', 'intrigue', 'fantasy', 'setting', 'eternal', 'lies', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'dd67888c-bd8c-4ad6-b134-b1ad97e080c7';

-- The Year of No Shopping (The Year of No Shopping) - 16 keywords
UPDATE titles SET keywords = ARRAY['wild', 'social', 'experiment', 'makes', 'woman', 're-prioritize', 'life', 'year', 'shopping', 'COMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'd0eaaddf-2d0f-4b9b-8e09-3453ba663f1e';

-- Kneel Before Me (Kneel Before Me) - 12 keywords
UPDATE titles SET keywords = ARRAY['epic', 'fantasy', 'unique', 'worldbuilding', 'kneel', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'f29cb752-cb3c-4eb5-9fee-a40f6cf95815';

-- Shall We Pole Dance? (Shall We Pole Dance?) - 15 keywords
UPDATE titles SET keywords = ARRAY['quirky', 'story', 'thats', 'sweet', 'saucy', 'shall', 'pole', 'dance', 'COMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'ef4f9cfb-ac86-4355-bee9-16cd79de48f9';

-- Season of Change (Season of Change) - 11 keywords
UPDATE titles SET keywords = ARRAY['unconventional', 'romance', 'season', 'change', 'DRAMA', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '99b02f86-de61-4f71-be2d-ce7f04e13512';

-- Tori and Samuel (Tori and Samuel) - 15 keywords
UPDATE titles SET keywords = ARRAY['friends', 'friendship', 'harder', 'looks', 'never', 'cuter', 'tori', 'samuel', 'KIDS', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'deccf4eb-d467-4be5-a22b-0b283a3e5835';

-- I Wanna Be the Madam! (I Wanna Be the Madam!) - 14 keywords
UPDATE titles SET keywords = ARRAY['lure', 'low-level', 'showbiz', 'never', 'stranger', 'wanna', 'madam', 'COMEDY', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = 'ffea82c7-e999-4ee3-8ea5-129f4c9ab204';

-- Happy Birthday (Happy Birthday) - 11 keywords
UPDATE titles SET keywords = ARRAY['owned', 'mantaridi', 'happy', 'birthday', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '76642402-3528-415c-9cb7-4a4c189c6d00';

-- The Golden Light of Dawn (The Golden Light of Dawn) - 17 keywords
UPDATE titles SET keywords = ARRAY['unique', 'story', 'tough', 'female', 'guardian', 'chosen', 'one', 'golden', 'light', 'dawn', 'ROMANCE', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '14dd5a43-ba95-46c8-a4a0-6634bd37c989';

-- Sora's Eyes (Sora's Eyes) - 21 keywords
UPDATE titles SET keywords = ARRAY['contemporary', 'supernatural', 'horror', 'young', 'man', 'must', 'save', 'important', 'person', 'grudge', 'ancient', 'god', 'soras', 'eyes', 'LGBTQ+', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '29fff781-6fa0-40c2-81a8-bfa939c46087';

-- The Scarecrows (The Scarecrows) - 11 keywords
UPDATE titles SET keywords = ARRAY['new', 'signature', 'horror', 'scarecrows', 'THRILLER', 'webtoon', 'visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'] WHERE title_id = '234b05fd-1624-4fe6-9318-4baea38688e3';

-- Final verification query
SELECT 
  COUNT(*) as total_titles,
  COUNT(keywords) as titles_with_keywords,
  COUNT(keywords) * 100.0 / COUNT(*) as percentage_with_keywords,
  AVG(array_length(keywords, 1)) as avg_keywords_per_title
FROM titles;