/**
 * 第四轮批次 4 内链回填：老文 → 8 篇新文（5 篇 Pest + 3 篇洗衣）
 *
 * 每个新文配 3 套文案，每个宿主最多 2 条（本批：20 个宿主 / 24 条）。
 * organize-laundry-room、save-money-on-laundry、find-moisture-problems-early、
 * spiders-in-the-basement 各用 2 条。
 *
 * 措辞约定：句子以指针收尾（"For X, see {link}."），锚文本永远落在宾语位置。
 *
 * 用法：
 *   node scripts/relink-round4-batch4.mjs --dry
 *   node scripts/relink-round4-batch4.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const DRY = process.argv.includes('--dry');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');

const TARGETS = {
  'fleas-without-pets': {
    variants: [
      {
        anchor: 'the flea life cycle and why a carpet keeps hatching',
        sentence:
          'Hair worked into a carpet is a food source for more than one thing. For the insect that emerges from a cocoon under the pile months later, and the vacuuming routine that converts it, see {link}.',
      },
      {
        anchor: 'what a vacuum triggers as it passes',
        sentence:
          'The same pass that lifts soil also wakes what is waiting in the pile. For the species that stays dormant until it feels footsteps, see {link}.',
      },
      {
        anchor: 'what a rodent carries in with it',
        sentence:
          'Droppings are not the only thing an animal leaves behind. For the biting insect that travels on a rodent and finishes its life in the carpet, see {link}.',
      },
    ],
  },
  'earwigs-in-the-house': {
    variants: [
      {
        anchor: 'the insects that read humidity',
        sentence:
          'A damp reading in a basement has several visible symptoms. For the one with pincers that turns up in the bathroom, and the mulch band that produces it, see {link}.',
      },
      {
        anchor: 'why removing one pest raises another',
        sentence:
          'Predators and prey do not rise and fall together. For the insect that is purely a moisture reading, see {link}.',
      },
      {
        anchor: 'the wet strip a downspout leaves behind',
        sentence:
          'Water landing against the wall does more than stain the siding. For the insect living in the mulch it keeps wet, see {link}.',
      },
    ],
  },
  'house-centipedes': {
    variants: [
      {
        anchor: 'the argument against spraying a predator',
        sentence:
          'The same reasoning applies to another hunter in the same room. For the fifteen-legged one that eats roaches and silverfish, see {link}.',
      },
      {
        anchor: 'the hunter that follows a silverfish colony',
        sentence:
          'A food supply indoors attracts more than the thing eating it. For the arthropod that arrives once the silverfish are established, see {link}.',
      },
      {
        anchor: 'what a sprayed wall does to the things that eat roaches',
        sentence:
          'A residual does not distinguish between the pest and its predators. For the animal that keeps a roach population down, see {link}.',
      },
    ],
  },
  'springtails-in-house': {
    variants: [
      {
        anchor: 'the insect that appears above 90 percent humidity',
        sentence:
          'Drying a space down is measurable, and so is the population that answers it. For the millimetre-long jumper that cannot survive dry air, see {link}.',
      },
      {
        anchor: 'the other insect living in the same biofilm',
        sentence:
          'A drain supports more than one species. For the one that appears on the floor beside it, see {link}.',
      },
      {
        anchor: 'what grows where the caulk stays wet',
        sentence:
          'The film that survives a recaulk is food for something. For the insect that grazes on mold and algae, see {link}.',
      },
    ],
  },
  'cluster-flies-in-the-attic': {
    variants: [
      {
        anchor: 'the other autumn insect using the same six weeks',
        sentence:
          'The same window admits more than one overwintering species. For the fly that comes in through the soffit and sleeps in the wall, see {link}.',
      },
      {
        anchor: 'the gap above the soffit line',
        sentence:
          'Air sealing is usually framed as a heating measure. For the insect that uses the same opening as a winter shelter, and the four-week window to close it, see {link}.',
      },
      {
        anchor: 'what is already dead in the attic',
        sentence:
          'An attic that held one animal holds others. For the fly that overwinters in the same space and leaves a carcass problem behind, see {link}.',
      },
    ],
  },
  'indoor-drying-rack-setup': {
    variants: [
      {
        anchor: 'how long a load can stay damp before it sours',
        sentence:
          'A load that takes two days is already a smell problem. For the water arithmetic behind it, and the rack placement that fixes it, see {link}.',
      },
      {
        anchor: 'what a rack actually costs to run',
        sentence:
          'The saving depends on how the water leaves the room. For the setup that removes it without fogging the windows, see {link}.',
      },
      {
        anchor: 'the drying station the room needs',
        sentence:
          'Layout decides whether drying is a station or an improvisation. For load size, spacing, and the dehumidifier that makes it work, see {link}.',
      },
    ],
  },
  'laundry-supplies-storage-safety': {
    variants: [
      {
        anchor: 'the two bottles that must not share a shelf',
        sentence:
          'Compatibility is the sorting rule that matters more than bottle height. For the laundry-room version of it, see {link}.',
      },
      {
        anchor: 'storing products by reaction rather than by height',
        sentence:
          'Proximity is what produces the accidental mix. For the three chemical families and where each belongs, see {link}.',
      },
      {
        anchor: 'how long detergent stays effective',
        sentence:
          'Buying in bulk only saves money if it survives the shelf. For the storage rules that keep it from degrading, see {link}.',
      },
    ],
  },
  'stop-clothes-fading-and-pilling': {
    variants: [
      {
        anchor: 'why a knit pills in the dryer',
        sentence:
          'Drying damages more than it shrinks. For the fading and pilling mechanisms, and the shaver that repairs the surface, see {link}.',
      },
      {
        anchor: 'spot cleaning instead of a full wash',
        sentence:
          'Every cycle costs colour. For the garment that is fading as it is being cleaned, see {link}.',
      },
      {
        anchor: 'cold water and shade as colour protection',
        sentence:
          'Energy is not the only thing a lower temperature saves. For the dye chemistry behind it, see {link}.',
      },
    ],
  },
};

const PAIRS = [
  // 1 · 跳蚤
  ['remove-pet-hair-everywhere', 'fleas-without-pets', 'Step 3: Carpet and Rugs', 0],
  ['clean-carpet-without-rental-machine', 'fleas-without-pets', 'Why Vacuuming Is 80', 1],
  ['mice-in-the-walls', 'fleas-without-pets', 'The Four Traces and What Each One Means', 2],

  // 2 · 蠼螋
  ['find-moisture-problems-early', 'earwigs-in-the-house', 'The Three High-Risk Locations', 0],
  ['spiders-in-the-basement', 'earwigs-in-the-house', 'Why Killing Spiders Usually Makes', 1],
  ['fall-yard-and-gutter-cleanup', 'earwigs-in-the-house', 'Fix the discharge', 2],

  // 3 · 家蜈蚣
  ['spiders-in-the-basement', 'house-centipedes', 'What to Do Instead of Spraying', 0],
  ['silverfish-what-they-eat', 'house-centipedes', 'Why Humidity Is the Whole Story', 1],
  ['cockroaches-in-an-apartment', 'house-centipedes', 'Understand Why the Spray Failed', 2],

  // 4 · 跳虫
  ['find-moisture-problems-early', 'springtails-in-house', 'Fix the Source, Then Control the Humidity', 0],
  ['drain-flies-in-the-bathroom', 'springtails-in-house', 'Why Pouring Water Down the Drain Does Nothing', 1],
  ['remove-mold-bathroom-caulk', 'springtails-in-house', 'Dry and Prevent Recurrence', 2],

  // 5 · cluster flies
  ['boxelder-bugs-fall-invasion', 'cluster-flies-in-the-attic', 'The Window That Actually Matters', 0],
  ['prepare-home-for-fall', 'cluster-flies-in-the-attic', 'Air-seal before you insulate', 1],
  ['squirrels-in-the-attic', 'cluster-flies-in-the-attic', 'Clean the Attic Like a Contaminated Space', 2],

  // 6 · 室内晾衣
  ['remove-mildew-smell-laundry', 'indoor-drying-rack-setup', 'Fix the drying', 0],
  ['air-dry-vs-dryer-cost', 'indoor-drying-rack-setup', 'The Bigger Number: Clothes Last Longer', 1],
  ['organize-laundry-room', 'indoor-drying-rack-setup', 'Solve drying before you need it', 2],

  // 7 · 洗衣用品收纳
  ['organize-cleaning-supplies', 'laundry-supplies-storage-safety', 'Apply the chemical safety rules', 0],
  ['organize-laundry-room', 'laundry-supplies-storage-safety', 'Store supplies where you use them', 1],
  ['save-money-on-laundry', 'laundry-supplies-storage-safety', 'Buy Detergent Strategically', 2],

  // 8 · 褪色与起球
  ['wash-delicates-wool-silk', 'stop-clothes-fading-and-pilling', 'Dry correctly', 0],
  ['remove-laundry-stains', 'stop-clothes-fading-and-pilling', 'Prevent the next stain from setting', 1],
  ['save-money-on-laundry', 'stop-clothes-fading-and-pilling', 'Air-Dry Instead of Using the Dryer', 2],
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
