/**
 * 第四轮批次 2 内链回填：老文 → 5 篇 Pest Control 新文
 *
 * 每个新文配 3 套文案（按配对顺序轮换），每个宿主最多 1 条（共 15 宿主 / 15 条）。
 *
 * 措辞约定：句子以指针收尾（"For X, see {link}."），锚文本永远落在宾语位置。
 *
 * 用法：
 *   node scripts/relink-round4-batch2.mjs --dry
 *   node scripts/relink-round4-batch2.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const DRY = process.argv.includes('--dry');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');

const TARGETS = {
  'drain-flies-in-the-bathroom': {
    variants: [
      {
        anchor: 'how to clear drain flies for good',
        sentence:
          'A drain that keeps producing small flies is usually holding a film rather than a clog. For the insect that feeds on it — and the brushing step that ends it — see {link}.',
      },
      {
        anchor: 'the drain fly source inside the pipe',
        sentence:
          'Caulk that has failed holds a wet layer behind it, and so does the drain body a few inches away. For the fly that breeds in both, see {link}.',
      },
      {
        anchor: 'why a damp cabinet attracts drain flies',
        sentence:
          'Moisture in a cabinet is worth fixing for its own sake. For the insect that treats the same film as a nursery, see {link}.',
      },
    ],
  },
  'clothes-moths-vs-pantry-moths': {
    variants: [
      {
        anchor: 'how to tell clothes moths from pantry moths',
        sentence:
          'Not every small pale moth in a cupboard came from the cupboard. For the identification based on where the damage is, see {link}.',
      },
      {
        anchor: 'moths in stored wool',
        sentence:
          'Washing handles the garment; it does not handle the drawer the garment came out of. For the moth that breeds in stored wool, see {link}.',
      },
      {
        anchor: 'protecting wool in a closet from moths',
        sentence:
          'The way a closet is loaded decides what stays visible and what gets forgotten for a year. For the insect that lives in the forgotten part, see {link}.',
      },
    ],
  },
  'carpet-beetles-in-house': {
    variants: [
      {
        anchor: 'larvae in the carpet that are not stains',
        sentence:
          'Some marks in a carpet are animals rather than dirt. For the larva that eats the fiber and the dust beneath it, see {link}.',
      },
      {
        anchor: 'the pest that lives on pet hair',
        sentence:
          'The hair that collects in a carpet edge is food for something. For the beetle whose larvae live in it, see {link}.',
      },
      {
        anchor: 'pest-proofing stored textiles without poison',
        sentence:
          'Boxes and bins are chosen partly by what can get into them. For the insect that gets into stored wool, and the inspection route that finds it, see {link}.',
      },
    ],
  },
  'boxelder-bugs-fall-invasion': {
    variants: [
      {
        anchor: 'why boxelder bugs gather in autumn',
        sentence:
          'Some insects arrive in autumn to shelter rather than to feed. For the one that gathers on a sunlit wall, and the two cases where it is worth acting on, see {link}.',
      },
      {
        anchor: 'which gaps are worth sealing',
        sentence:
          'Not every gap should be closed, but the ones that let insects into a wall usually should. For the autumn invader that uses them, see {link}.',
      },
      {
        anchor: 'handling insects on the exterior wall',
        sentence:
          'The yard side of the house is where autumn pests stage before they move in. For the bug that gathers by the thousand on one elevation, see {link}.',
      },
    ],
  },
  'squirrels-in-the-attic': {
    variants: [
      {
        anchor: 'how to tell a squirrel from a mouse in a wall',
        sentence:
          'The clock is the fastest test, and the treatment differs completely either way. For the daytime rodent and the entry it uses, see {link}.',
      },
      {
        anchor: 'the materials that stop a squirrel',
        sentence:
          'Foam is chewed through and hardware cloth is not. For the animal that needs a two-inch hole, the litter timing, and the one-way door, see {link}.',
      },
      {
        anchor: 'what to look for at the roof edge',
        sentence:
          'The roof edge is where an inspection pays for itself. For the animal that chews its way in up there, and the wiring it damages, see {link}.',
      },
    ],
  },
};

const PAIRS = [
  // 1 · 蛾蚋
  ['unclog-shower-drain', 'drain-flies-in-the-bathroom', 'Step 7: Prevent It Coming Back', 0],
  ['remove-mold-bathroom-caulk', 'drain-flies-in-the-bathroom', 'Step 6: Dry and Prevent Recurrence', 1],
  ['organize-under-sink', 'drain-flies-in-the-bathroom', 'Step 6: Handle Moisture and Odors', 2],

  // 2 · 衣蛾
  ['pantry-moths-vs-fruit-flies', 'clothes-moths-vs-pantry-moths', 'Step 6: Monitor for Eight Weeks', 0],
  ['wash-delicates-wool-silk', 'clothes-moths-vs-pantry-moths', 'Step 5: Store correctly', 1],
  ['organize-a-closet', 'clothes-moths-vs-pantry-moths', 'Step 6: Build the maintenance rules', 2],

  // 3 · 地毯甲虫
  ['clean-carpet-without-rental-machine', 'carpet-beetles-in-house', 'Step 6: The Stains That Are Not Dirt', 0],
  ['remove-pet-urine-stains-carpet', 'carpet-beetles-in-house', 'Step 1: Find and Assess the Stains', 1],
  ['basement-storage-without-ruining', 'carpet-beetles-in-house', 'Step 7: Pest-proof without poison', 2],

  // 4 · 箱蝽
  ['keep-bugs-out-of-house-summer', 'boxelder-bugs-fall-invasion', 'Step 6: Handle the pest-specific cases', 0],
  ['seal-gaps-doors-windows', 'boxelder-bugs-fall-invasion', 'Step 0: Find Where the Air Actually Comes In', 1],
  ['prepare-home-for-fall', 'boxelder-bugs-fall-invasion', 'Step 5: Prepare the yard and the exterior of the house', 2],

  // 5 · 阁楼松鼠
  ['mice-in-the-walls', 'squirrels-in-the-attic', 'How to Tell a Mouse From a Rat From a Squirrel', 0],
  ['mouse-proof-before-winter', 'squirrels-in-the-attic', 'Materials That Actually Stop a Mouse', 1],
  ['fall-yard-and-gutter-cleanup', 'squirrels-in-the-attic', 'Step 8: Do the roof-edge inspection while you are up there', 2],
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
