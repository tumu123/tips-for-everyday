/**
 * 第四轮批次 3 内链回填：老文 → 5 篇 Pest Control 新文
 *
 * 每个新文配 3 套文案，每个宿主最多 2 条（本批：13 个宿主 / 15 条）。
 * save-money-on-pest-control-diy 用 2 条（它是全站枢纽文）。
 *
 * 措辞约定：句子以指针收尾（"For X, see {link}."），锚文本永远落在宾语位置。
 *
 * 用法：
 *   node scripts/relink-round4-batch3.mjs --dry
 *   node scripts/relink-round4-batch3.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const DRY = process.argv.includes('--dry');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');

const TARGETS = {
  'cockroaches-in-an-apartment': {
    variants: [
      {
        anchor: 'why spraying scatters cockroaches',
        sentence:
          'Repellency is the same trap with ants, and it fails the same way. For the species that splits its colony when sprayed, and the bait that reaches the cavity, see {link}.',
      },
      {
        anchor: 'what a damp cabinet under the sink harbours',
        sentence:
          'Moisture decides which cabinet a population chooses. For the insect that treats a warm, humid void as home, and the monitor that proves it, see {link}.',
      },
      {
        anchor: 'moisture as the root of a pest problem',
        sentence:
          'Drying a space down is the step that makes the rest hold. For the insect that prefers it wet, and why a spray cannot reach it, see {link}.',
      },
    ],
  },
  'stink-bugs-in-the-house': {
    variants: [
      {
        anchor: 'how to tell a stink bug from a boxelder bug',
        sentence:
          'Only one of the two is worth excluding properly. For the shield-shaped one that stays active all winter, the light trap, and the two cases where you must not act, see {link}.',
      },
      {
        anchor: 'sealing the autumn entry points',
        sentence:
          'Every gap closed in September is a gap that does not deliver insects in January. For the insect that overwinters in a wall, and how to catch the ones already inside, see {link}.',
      },
      {
        anchor: 'air sealing before the cold arrives',
        sentence:
          'The seams that leak heat are the seams that admit insects. For the species that uses them as a winter shelter, see {link}.',
      },
    ],
  },
  'bed-bugs-or-something-else': {
    variants: [
      {
        anchor: 'whether the marks are bites or bristles',
        sentence:
          'A rash attributed to bites is often neither a bite nor a bug you can spray for. For the identification that depends on physical evidence, see {link}.',
      },
      {
        anchor: 'confirming the species before treating',
        sentence:
          'Getting the species wrong wastes a treatment and a month. For the one household pest where the right first move is to stop and call someone, see {link}.',
      },
      {
        anchor: 'identifying a pest before acting on it',
        sentence:
          'The first step of the general method matters more here than anywhere else. For the evidence that settles an ambiguous bite, see {link}.',
      },
    ],
  },
  'wasp-nest-when-to-call-a-professional': {
    variants: [
      {
        anchor: 'materials that resist chewing and stinging',
        sentence:
          'Exclusion and removal are different jobs with different materials. For the nests you should not touch, and the species that decides it, see {link}.',
      },
      {
        anchor: 'why not every gap should be sealed',
        sentence:
          'Blocking the wrong opening is worse than leaving it. For the nest that turns inward when its entrance is closed, see {link}.',
      },
      {
        anchor: 'what the roof-edge inspection turns up',
        sentence:
          'Eaves and soffits are where two kinds of problem start. For the one that is a colony rather than a leak, and the three cases that need a professional, see {link}.',
      },
    ],
  },
  'rats-around-compost-and-bird-feeders': {
    variants: [
      {
        anchor: 'what the droppings mean for the next step',
        sentence:
          'Identifying the animal is only half of it; the other half is what is feeding it. For the outdoor food sources that hold a colony in place, see {link}.',
      },
      {
        anchor: 'the outdoor work that belongs to autumn',
        sentence:
          'The yard is where the pressure on a house is generated. For the compost and feeder changes that reduce it, see {link}.',
      },
      {
        anchor: 'handling exterior and outdoor items',
        sentence:
          'A woodpile and a feed bag are shelter and food respectively. For the pair of outdoor subsidies that keep rats on the property, see {link}.',
      },
    ],
  },
};

const PAIRS = [
  // 1 · 蟑螂
  ['get-rid-of-ants-in-the-kitchen', 'cockroaches-in-an-apartment', 'Why Spraying Makes Ants Worse', 0],
  ['organize-under-sink', 'cockroaches-in-an-apartment', 'Step 6: Handle Moisture and Odors', 1],
  ['remove-mold-bathroom-caulk', 'cockroaches-in-an-apartment', 'Step 6: Dry and Prevent Recurrence', 2],

  // 2 · 棕纹蝽
  ['boxelder-bugs-fall-invasion', 'stink-bugs-in-the-house', 'How They Differ From Stink Bugs', 0],
  ['save-money-on-pest-control-diy', 'stink-bugs-in-the-house', 'Step 2: Find Where They Are Getting In', 1],
  ['prepare-home-for-fall', 'stink-bugs-in-the-house', 'Step 2: Air-seal before you insulate', 2],

  // 3 · 臭虫
  ['carpet-beetles-in-house', 'bed-bugs-or-something-else', 'Step 1: Confirm You Have Larvae, Not Just Adults', 0],
  ['pantry-moths-vs-fruit-flies', 'bed-bugs-or-something-else', 'Step 1: Confirm the Insect Before Anything Else', 1],
  ['save-money-on-pest-control-diy', 'bed-bugs-or-something-else', 'Step 1: Identify What You Actually Have', 2],

  // 4 · 黄蜂
  ['mouse-proof-before-winter', 'wasp-nest-when-to-call-a-professional', 'Materials That Actually Stop a Mouse', 0],
  ['seal-gaps-doors-windows', 'wasp-nest-when-to-call-a-professional', 'Step 8: Do Not Seal Everything', 1],
  ['fall-yard-and-gutter-cleanup', 'wasp-nest-when-to-call-a-professional', 'Step 8: Do the roof-edge inspection while you are up there', 2],

  // 5 · 室外鼠患
  ['rats-vs-mice-droppings', 'rats-around-compost-and-bird-feeders', 'What Each Answer Means for the Next Step', 0],
  ['fall-maintenance-checklist-homeowners', 'rats-around-compost-and-bird-feeders', 'Tier 2: Before the first hard freeze', 1],
  ['winterize-your-home-complete-guide', 'rats-around-compost-and-bird-feeders', 'Step 7: Exterior and outdoor items', 2],
];

const variantOf = (target, forced) => {
  const list = TARGETS[target].variants;
  return typeof forced === 'number' ? list[forced] : list[0];
};

const CAT_ROUTE = {
  'Fix It': 'fix-it',
  'Save Money': 'save-money',
  'Home Hacks': 'home-hacks',
  'Kitchen Tips': 'kitchen-tips',
  Organize: 'organize',
  'Seasonal & Holiday': 'seasonal',
  'Pest Control': 'pest-control',
};
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const read = (slug) => fs.readFileSync(path.join(DIR, `${slug}.md`), 'utf8');
const meta = (src, key) => {
  const m = src.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, 'm'));
  return m ? m[1] : '';
};
const pathOf = (slug) => {
  const src = read(slug);
  const cat = CAT_ROUTE[meta(src, 'category')];
  const sub = slugify(meta(src, 'subcategory'));
  if (!cat) throw new Error(`未知栏目：${slug} → ${meta(src, 'category')}`);
  return `/${cat}/${sub}/${slug}/`;
};

// ---- 校验 ----
const allSlugs = new Set(files.map(slugOf));
const hostCount = new Map();
const targetCount = new Map();
for (const [h, t] of PAIRS) {
  if (!allSlugs.has(h)) throw new Error(`宿主不存在：${h}`);
  if (!allSlugs.has(t)) throw new Error(`目标不存在：${t}`);
  if (!TARGETS[t]) throw new Error(`目标缺少文案：${t}`);
  if (h === t) throw new Error(`自链：${h}`);
  hostCount.set(h, (hostCount.get(h) || 0) + 1);
  targetCount.set(t, (targetCount.get(t) || 0) + 1);
}
const overHost = [...hostCount].filter(([, n]) => n > 2);
const thinTarget = Object.keys(TARGETS).filter((t) => (targetCount.get(t) || 0) < 2);
if (overHost.length) throw new Error('宿主超过 2 条：' + overHost.map(([h, n]) => `${h}(${n})`).join(', '));
if (thinTarget.length) throw new Error('目标不足 2 条：' + thinTarget.join(', '));

// ---- 小节选择 ----
const EXCLUDE = /faq|frequently asked|related|what not|sources|bottom line|conclusion/i;

function sections(lines) {
  const heads = [];
  lines.forEach((l, i) => {
    if (/^##\s+/.test(l)) heads.push({ i, title: l.replace(/^##\s+/, '').trim() });
  });
  return heads
    .map((h, k) => ({
      title: h.title,
      start: h.i + 1,
      end: k + 1 < heads.length ? heads[k + 1].i : lines.length,
    }))
    .filter((s) => !EXCLUDE.test(s.title));
}

function pickSection(lines, hint) {
  const secs = sections(lines);
  const re = new RegExp(hint, 'i');
  const hit = secs.find((s) => re.test(s.title));
  if (!hit) throw new Error(`小节提示未命中：${hint}`);
  return hit;
}

// ---- 写入 ----
let changed = 0;
const log = [];
for (const [host, target, hint, forced] of PAIRS) {
  const src = read(host);
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const link = pathOf(target);
  const variant = variantOf(target, forced);
  if (src.includes(`](${link})`)) {
    log.push(`skip  ${host} → ${target}（已有链接）`);
    continue;
  }
  const fmEnd = src.indexOf('---', 3);
  const head = src.slice(0, src.indexOf('\n', fmEnd) + 1);
  const bodyRaw = src.slice(head.length);
  const lines = bodyRaw.split(/\r?\n/);
  const section = pickSection(lines, hint);
  let cut = section.end;
  const trimBlank = () => {
    while (cut > section.start && lines[cut - 1].trim() === '') cut--;
  };
  trimBlank();
  const insertAt = cut;
  const sentence = variant.sentence.replace('{link}', `[${variant.anchor}](${link})`);
  lines.splice(insertAt, 0, '', sentence);
  const out = head + lines.join(eol);
  log.push(`ok    ${host} → ${target}  @ 「${section.title}」`);
  if (!DRY) fs.writeFileSync(path.join(DIR, `${host}.md`), out, 'utf8');
  changed++;
}

console.log(log.join('\n'));
console.log(`\n${DRY ? '[dry] ' : ''}共 ${changed} 条，${hostCount.size} 个宿主，${Object.keys(TARGETS).length} 个目标`);
