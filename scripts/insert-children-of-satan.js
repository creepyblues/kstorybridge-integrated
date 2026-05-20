/**
 * One-off insert: "Children of Satan (사탄의 아이들)" (Naver Series Novel).
 *
 * Why a one-off script: the admin /admin/titles "Add New Title" button is
 * unwired, and Naver Series novel URLs aren't supported by title-intelligence
 * (only /comic/). All metadata was provided manually, so we insert directly.
 *
 * Required env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node --env-file=.env.local scripts/insert-children-of-satan.js          # dry-run
 *   node --env-file=.env.local scripts/insert-children-of-satan.js --apply  # actually insert
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");

const ADMIN_EMAIL = "sungho@kstorybridge.com";

const TITLE_URL =
  "https://series.naver.com/novel/detail.series?productNo=9051532";

const SYNOPSIS_KR = `태초에, 신은 천사들과 함께 세계를 창조했다. 그들은 자신들의 교리를 받들 존재들과 그들이 지낼 땅과 물을 만들어 주었다. 신의 충실한 메신저이자 일꾼이었던 루시퍼는 여섯의 부하와 함께 우주를 다니며 신의 심부름을 했다. 그러던 중, 루시퍼는 자신의 공적을 인정받아 자신들이 통치할 땅을 달라고 신에게 요구를 했고 이것이 받아들여지지 않자 신을 상대로 반란을 일으키게 된다. 이에 미카엘과 가브리엘을 비롯한 치천사들이 그와 여섯 부하를 잡아 땅 속 깊숙이 봉인하고 그곳에서 벗어나지 못하게 가두게 되었다. 그것이 지옥의 시작이었다. 루시퍼를 포함한 여섯 부하들은 땅 속 깊은 곳에서 7대 사탄으로 군림하게 되고, 신에 대한 복수를 하기 위해 악한 세력을 끌어 모으니 72 상급악마와 예하 중급 악마, 노예인 하급악마 발레인들을 대규모 양성해 나간다. 그러던 중, 루시퍼는 신성성에 큰 상처를 입혔던 '롱기누스의 창' 본체가 한국에 있다는 흔적을 찾으며 2023년 사순절 전에 이승 연옥을 점령할 것이라는 미래를 보게 된다. 그리하여 그 미래를 만들기 위해 상급악마들을 이용해 롱기누스의 창 수색과 동시에 이승을 점령할 군대를 양성한다.

스페인 도미니코 수도회에서 자란 최성준은 사탄과 전면적으로 싸우는 '텔룸'의 일원으로서 상당한 전투 능력자이다. 그런 그가 교황청의 명령을 받아 한국에서 보좌신부로 근무하던 도중, 노완석 추기경이 그를 호출한다. 현재 한국에 부마자들이 급증하고 있으니 이 현상에 대해 조사를 하라는 것이었다. 또한 교황청에서도 최성준 신부에게 구마에 대한 전권을 일임하는데 허가를 해주며, 최성준은 한국의 부마자들을 추적하기 시작한다. 그러던 중, 성준은 롱기누스의 창이 19세기 이후, 한국에 숨겨져 있으며 사탄들이 그 창을 통해 연옥을 점령하려 한다는 사실을 알게 된다. 이에 성준은 사탄이 롱기누스의 창을 차지하기 전에, 먼저 찾아냄과 동시에 이승 공격의 최선봉장인 상급 악마 바알을 찾기 위해 전투를 시작한다.

한편, 한국에서 부마자가 급증하는 것과 사탄의 공격에 대해 의구심이 든 노완석 추기경은 자체적으로 현재 상황과 최성준, 그리고 텔룸에 대해 뒷조사를 하게 된다. 그리하여 성준이 루시퍼의 아들이라는 사실을 알게 된 노완석 추기경은 7대 악마들이 성준을 통해 이승으로 건너오려는 것임을 알게 되고, 성준을 적으로 규정하게 된다. 상황이 이렇게 되자 성준은 자기 출생의 비밀에 대해 스스로 알아내려 한다. 그리고 자신을 키워준 안토니오 로드리게즈에 대해 알게 된다. 사실 안토니오 로드리게즈는 성준이 루시퍼의 아들이라는 사실을 알고 그를 볼모로 삼아 7대 악마들을 이승으로 불러들여 처치할 계획을 하고 있던 것이었다. 7대 악마는 지옥에 구속되어 있었지만 그들의 능력은 계속 발휘되고 있었고, 여러 종류의 악을 만들며 사람들을 유혹하고 있었다. 안토니오 로드리게즈는 이런 행태를 가만 두고 보지 못한 것이었다. 결국 그가 세운 계획은 악마들을 이승으로 불러와 직접 목전에서 악마들을 소멸시키겠다는 것이었다. 지옥에 갈 수 없는 산 자들이 사탄을 처치하기 위해서는 어쩔 수 없다는 논리였다. 그러는 사이 결국 롱기누스의 창은 제주도에서 발견이 되면서 사탄의 손에 넘어가게 되고, 이승 연옥을 지키기 위한 성준의 최후 전투가 시작된다.`;

const SYNOPSIS_EN = `In the beginning, God created the world with the angels. Lucifer, God's most faithful messenger, traveled the cosmos with six lieutenants carrying out divine errands — until he demanded land of his own to rule. When refused, he led a rebellion, was bound in the depths of the earth by Michael and Gabriel, and Hell was born. From there, Lucifer and his six fallen lieutenants — the Seven Satans — raised an army of 72 upper demons, mid-rank demons, and slave-rank Valains, all in service of revenge against God. Centuries later, Lucifer learns the Spear of Longinus — the relic that once wounded divinity itself — is hidden in Korea, and that he must claim it before Lent 2023 to overrun Earth's purgatory.

Choi Sung-jun was raised in the Spanish Dominican Order as a member of Telum, God's elite anti-Satan unit. Dispatched to Korea as an assistant priest, he is summoned by Cardinal Noh Wan-seok to investigate a surge of demonic possessions. The Vatican grants Sung-jun full authority over exorcisms, and he begins tracking down the possessed. He soon discovers that the Spear of Longinus has been hidden in Korea since the 19th century, and that the Satans intend to use it to seize purgatory. Sung-jun sets out to find the Spear first — and to hunt Baal, the upper demon leading the assault on the mortal world.

Suspicious of the surge in possessions and the role of Telum, Cardinal Noh runs his own investigation and uncovers the truth: Sung-jun is Lucifer's son, the vessel through which the Seven Satans intend to enter the mortal world. He brands Sung-jun an enemy. Forced to confront his own origin, Sung-jun learns that Antonio Rodriguez — the man who raised him — has known all along and has been using him as bait to lure the Seven Satans out of Hell so the living can destroy them face to face. When the Spear is finally uncovered on Jeju Island and falls into Satanic hands, Sung-jun's final battle to defend earthly purgatory begins.`;

// Characters / world detail go in `description` (admin-facing English notes).
const DESCRIPTION = `Characters:
- Choi Sung-jun: Son of Lucifer, born to a Dominican nun (Kim Young-mi) whom Lucifer chose as a virgin mother to spite Mary and Christ. Carries Lucifer's power; with the Spear of Longinus in his hand he becomes immensely powerful. Can communicate with the Satans and possesses deep knowledge of them.
- Sister Sung Min-young: A nun who has seen demons since childhood and has lived in combat ever since. Her exorcism ability rivals Sung-jun's. Boyish, proactive — and unknowingly marked by Lucifer as the sacrifice Sung-jun must kill to fully turn evil. Given a past mirroring Sung-jun's so the two would bond.
- Father Lee Moon-bae: A former gangster turned priest after receiving the Holy Spirit in a dream. Combat-hardened, devout, and fiercely loyal.
- Antonio Rodriguez: Leader of the Spanish Dominican order Telum ("God's Weapon"). Raised Sung-jun and is the only person who knows his origin. Plans to draw the Seven Satans into the mortal world so the living can destroy them directly.
- Cardinal Noh Wan-seok: The Korean cardinal who first suspects Sung-jun's true nature. Rigid, rule-bound, intolerant of unorthodoxy.

Setting: Modern-day Korea + Catholic theological cosmology. 3rd-person POV. Completed at 250 episodes.
Themes: demonic possession, exorcism, divine lineage, anti-clerical politics, the Spear of Longinus.`;

const TITLE_PAYLOAD = {
  title_name_kr: "사탄의 아이들",
  title_name_en: "Children of Satan",
  title_url: TITLE_URL,
  content_format: "web_novel",
  genre: ["fantasy"],
  chapters: 250,
  completed: true,
  synopsis_kr: SYNOPSIS_KR,
  synopsis: SYNOPSIS_EN,
  description: DESCRIPTION,
  keywords: [
    "악마",
    "사탄",
    "신부",
    "구마사제",
    "루시퍼",
    "롱기누스의 창",
    "구마",
    "부마자",
    "오컬트",
    "네이버시리즈",
  ],
  priority: "2",
  verified: false,
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resolveAdminUserId() {
  // GoTrue admin /users endpoint ignores ?email=; page through and filter.
  for (let page = 1; page <= 20; page++) {
    const url = `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) {
      throw new Error(`auth admin lookup failed: HTTP ${res.status} ${await res.text()}`);
    }
    const body = await res.json();
    const users = body.users || (Array.isArray(body) ? body : []);
    const match = users.find((u) => (u.email || "").toLowerCase() === ADMIN_EMAIL);
    if (match) return match.id;
    if (users.length < 200) break; // last page
  }
  throw new Error(`No auth.users row found for ${ADMIN_EMAIL}`);
}

async function findExisting(creatorId) {
  // Mirror the unique index: same EN+KR pair (lower(trim()), case/whitespace-insensitive) for this creator.
  const { data, error } = await supabase
    .from("titles")
    .select("title_id, title_name_kr, title_name_en, title_url, created_at")
    .eq("creator_id", creatorId)
    .or(
      `title_url.eq.${encodeURIComponent(TITLE_URL)},and(title_name_kr.eq.${encodeURIComponent(TITLE_PAYLOAD.title_name_kr)},title_name_en.eq.${encodeURIComponent(TITLE_PAYLOAD.title_name_en)})`
    );
  if (error) throw new Error(`Duplicate check failed: ${error.message}`);
  return data || [];
}

async function main() {
  console.log(APPLY ? "[apply] inserting…" : "[dry-run] no DB writes will happen");
  const creatorId = await resolveAdminUserId();
  console.log(`creator_id resolved for ${ADMIN_EMAIL}: ${creatorId}`);

  const existing = await findExisting(creatorId);
  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing matching row(s):`);
    for (const row of existing) {
      console.log(
        `  - title_id=${row.title_id} kr="${row.title_name_kr}" en="${row.title_name_en}" url=${row.title_url} created=${row.created_at}`
      );
    }
    console.log("Aborting without insert. Edit at /admin/titles instead.");
    return;
  }

  if (!APPLY) {
    console.log("Would insert:");
    console.log(JSON.stringify({ ...TITLE_PAYLOAD, creator_id: creatorId, synopsis: "<…trimmed…>", synopsis_kr: "<…trimmed…>", description: "<…trimmed…>" }, null, 2));
    console.log("\nRe-run with --apply to perform the insert.");
    return;
  }

  const { data, error } = await supabase
    .from("titles")
    .insert([{ ...TITLE_PAYLOAD, creator_id: creatorId }])
    .select("title_id, slug, title_name_kr, title_name_en, content_format, genre, priority, chapters, created_at")
    .single();

  if (error) {
    console.error("INSERT failed:", error.message);
    process.exit(2);
  }

  console.log("Inserted:");
  console.log(JSON.stringify(data, null, 2));
  console.log(
    "\nAuto-embedding trigger has fired async (see auto_generate_embedding_on_insert)."
  );
  console.log(
    "Verify with:\n  SELECT title_id, slug, combined_embedding IS NOT NULL AS has_embedding\n  FROM titles WHERE title_id = '" +
      data.title_id +
      "';"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
