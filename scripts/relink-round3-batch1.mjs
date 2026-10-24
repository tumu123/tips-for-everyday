/**
 * 第三轮批次 1 内链回填：老文 → 10 篇 Fix It 新文
 *
 * 与 relink-round2.mjs 同一套逻辑：每条配对指定「宿主文章」与「目标文章」，
 * 脚本自动在宿主正文里挑选最相关的小节，在该小节末尾补一句带内链的话。
 *
 * 与 round2 的差别：每个目标准备 3–4 套「锚文本 + 句子」变体，按出现顺序轮换，
 * 避免同一句话在同站多篇文章里重复出现（模板化痕迹）。
 *
 * 约束：每个宿主最多 2 条，每个新文至少 2 条。
 *
 * 用法：
 *   node scripts/relink-round3-batch1.mjs --dry    # 只打印计划，不改文件
 *   node scripts/relink-round3-batch1.mjs          # 写入
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const DRY = process.argv.includes('--dry');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');

/** 目标文章：多套锚文本 + 句子（{link} 会被替换成 Markdown 链接） */
const TARGETS = {
  'water-heater-no-hot-water': {
    variants: [
      {
        anchor: 'diagnosing no hot water',
        sentence:
          'Before booking a service call, work the symptom — {link} separates a breaker or pilot failure from a dip tube or a crossover that only looks like a dead heater.',
      },
      {
        anchor: 'why a heater stops making hot water',
        sentence:
          'A heater that runs but delivers nothing has a different fault from one that is silent — {link} follows the symptom rather than the brand.',
      },
      {
        anchor: 'what to check before calling about hot water',
        sentence:
          'If the water went cold on the first hard freeze of the year, suspect the supply line rather than the tank — {link} covers that branch and the three others.',
      },
    ],
  },
  'washing-machine-wont-drain': {
    variants: [
      {
        anchor: 'finding where a washer drain is blocked',
        sentence:
          'When the drum will not empty, the blockage sits in one of four places — {link} walks them in the order that does not end in a flooded floor.',
      },
      {
        anchor: 'a washer that will not drain',
        sentence:
          'A machine that hums but will not empty is usually blocked rather than broken — {link} starts at the filter, which is where most cases end.',
      },
      {
        anchor: 'standing water in the drum',
        sentence:
          'Bailing the drum out is a stopgap and not a fix — {link} covers the filter, the hose, the standpipe, and the pump in that order.',
      },
    ],
  },
  'washer-wont-spin-or-walks': {
    variants: [
      {
        anchor: 'a washer that will not spin or walks across the floor',
        sentence:
          'Load balance, levelling, and worn suspension all produce the same complaint — {link} separates them before you order a part.',
      },
      {
        anchor: 'why a washer refuses to spin',
        sentence:
          'The machine aborts the spin when it cannot balance the load, which reads as a fault — {link} covers the three gates it checks first.',
      },
      {
        anchor: 'diagnosing a washer that shakes or will not spin',
        sentence:
          'A machine that only fails on big loads is telling you about vibration rather than the motor — {link} covers what that points to.',
      },
    ],
  },
  'dryer-not-heating': {
    variants: [
      {
        anchor: 'a dryer that tumbles but will not heat',
        sentence:
          'Electric, gas, and heat pump dryers fail for entirely different reasons — {link} checks the vent before the machine, because one of those failures is a fire risk.',
      },
      {
        anchor: 'why a dryer runs cold',
        sentence:
          'A blown thermal fuse is reporting an airflow problem rather than causing one — {link} covers the order that stops it blowing again.',
      },
    ],
  },
  'refrigerator-not-cold-freezer-fine': {
    variants: [
      {
        anchor: 'a fridge that is warm while the freezer is fine',
        sentence:
          'That specific combination rules out the sealed system and the refrigerant — {link} covers the defrost, fan, and damper checks that follow.',
      },
      {
        anchor: 'why the fridge warms while the freezer holds',
        sentence:
          'One evaporator feeds both compartments, so anything downstream of the coil can fail without touching the freezer — {link} covers that air path.',
      },
      {
        anchor: 'a refrigerator that loses the fridge side only',
        sentence:
          'Frost on the freezer back wall is the tell for a defrost failure — {link} covers the 24-hour test that confirms it without tools.',
      },
    ],
  },
  'dishwasher-leaves-water-in-bottom': {
    variants: [
      {
        anchor: 'water left in the bottom of a dishwasher',
        sentence:
          'A quarter inch above the sump is designed retention and a pool is not — {link} separates the two before anyone buys a pump.',
      },
      {
        anchor: 'a dishwasher that will not drain',
        sentence:
          'The drain cycle is time-limited rather than level-sensed, so a partial clog leaves water behind every time — {link} covers where that clog sits.',
      },
      {
        anchor: 'why water stays in the dishwasher',
        sentence:
          'Water that comes back after you mop it out is backflow rather than a drain failure — {link} covers the high loop and the check valve.',
      },
    ],
  },
  'garage-door-wont-open': {
    variants: [
      {
        anchor: 'a garage door that will not open',
        sentence:
          'The red release cord disconnects the door from the opener, which is the most common cause of a motor running with nothing moving — {link} covers that and the sensor checks.',
      },
      {
        anchor: 'garage door faults that are not the opener\u2019s fault',
        sentence:
          'A door that has become impossibly heavy has lost its counterbalance — {link} explains which failures are safe to touch and which are not.',
      },
      {
        anchor: 'dealing with a garage door that will not open',
        sentence:
          'Most of it resolves at the sensors, the release cord, or the track — {link} covers those and names the one repair never to attempt yourself.',
      },
      {
        anchor: 'testing a garage door after clearing the floor',
        sentence:
          'Once the space is clear, run the door through a full cycle — {link} covers the sensor alignment and track problems that a cleared garage usually exposes.',
      },
    ],
  },
  'water-stain-on-ceiling': {
    variants: [
      {
        anchor: 'reading a water stain on a ceiling',
        sentence:
          'The position of the stain narrows the source to a handful of suspects — {link} covers that map, plus the order that stops it coming back.',
      },
      {
        anchor: 'tracing a ceiling leak to its source',
        sentence:
          'Water runs along joists before it comes through, so the stain is often offset from the leak — {link} covers how to map it with a moisture meter.',
      },
      {
        anchor: 'a ceiling stain that keeps coming back',
        sentence:
          'Painting over a stain without a shellac primer guarantees its return — {link} covers what has to happen before the paint goes on.',
      },
      {
        anchor: 'a ceiling stain that appears after a freeze',
        sentence:
          'A pipe that froze and split usually shows up first as a brown stain on the ceiling below it — {link} covers the order that stops the damage spreading.',
      },
    ],
  },
  'find-moisture-problems-early': {
    variants: [
      {
        anchor: 'finding moisture before mold starts',
        sentence:
          'Mold needs about 48 hours of sustained damp, which makes early detection the whole game — {link} covers the readings and where to take them.',
      },
      {
        anchor: 'checking a house for hidden moisture',
        sentence:
          'A musty smell you have stopped noticing is the most reliable early signal there is — {link} covers what to measure and where.',
      },
      {
        anchor: 'keeping indoor humidity in the safe range',
        sentence:
          'Above about 55% relative humidity, surfaces stay damp long enough for spores to colonise — {link} covers the instruments and the three locations that matter.',
      },
    ],
  },
  'diy-or-call-a-professional': {
    variants: [
      {
        anchor: 'deciding whether a repair is DIY or a professional job',
        sentence:
          'Sort the job by what it costs to get wrong rather than by how hard it looks — {link} applies that rule to twenty common repairs.',
      },
      {
        anchor: 'which repairs are safe to do yourself',
        sentence:
          'The dangerous jobs are rarely the difficult ones — {link} sorts them by the cost of the mistake instead of by skill.',
      },
      {
        anchor: 'when a homeowner should stop and hire',
        sentence:
          'Green, yellow, and red: the tiering is about consequences rather than confidence — {link} covers the test and the twenty jobs it sorts.',
      },
      {
        anchor: 'the line between a DIY fix and a service call',
        sentence:
          'If you cannot describe the failure modes out loud before starting, the job is yellow at best — {link} covers that rule.',
      },
    ],
  },
};

/** [宿主, 目标, 小节标题提示（可选正则）] */
const PAIRS = [
  // 1 · no hot water
  ['water-heater-maintenance', 'water-heater-no-hot-water', 'Know when to replace'],
  ['water-heater-temperature-setting-savings', 'water-heater-no-hot-water', 'What the Temperature Actually Controls'],
  ['prevent-frozen-pipes', 'water-heater-no-hot-water', 'What to do if a pipe freezes'],

  // 2 · washer won't drain
  ['how-to-clean-washing-machine', 'washing-machine-wont-drain', 'Preventing Odor and Buildup'],
  ['remove-mildew-smell-laundry', 'washing-machine-wont-drain', 'Clean the washing machine'],
  ['save-money-on-laundry', 'washing-machine-wont-drain', 'Maintain the Machine'],

  // 3 · washer won't spin
  ['save-money-on-laundry', 'washer-wont-spin-or-walks', 'Run Full Loads'],
  ['how-to-clean-washing-machine', 'washer-wont-spin-or-walks', 'Part 1: Routine Clean'],
  ['organize-laundry-room', 'washer-wont-spin-or-walks', 'Make the machine zone'],

  // 4 · dryer won't heat
  ['fall-maintenance-checklist-homeowners', 'dryer-not-heating', 'Before first use'],
  ['remove-laundry-stains', 'dryer-not-heating', 'Prevent the next stain from setting'],

  // 5 · fridge warm, freezer fine
  ['how-long-food-lasts-shelf-life-guide', 'refrigerator-not-cold-freezer-fine', 'Refrigerator shelf life'],
  ['thaw-food-safely', 'refrigerator-not-cold-freezer-fine', 'power outages'],
  ['prevent-freezer-burn-on-meat', 'refrigerator-not-cold-freezer-fine', 'meat-specific time limits'],

  // 6 · dishwasher standing water
  ['clean-dishwasher-filter', 'dishwasher-leaves-water-in-bottom', 'Check for Standing Water'],
  ['fix-garbage-disposal', 'dishwasher-leaves-water-in-bottom', 'Clear a Downstream Clog'],
  ['unclog-slow-drain', 'dishwasher-leaves-water-in-bottom', 'Clean the Trap'],

  // 7 · garage door
  ['organize-garage-one-weekend', 'garage-door-wont-open', 'Day 2: Build the Storage', 3],
  ['fix-door-wont-latch', 'garage-door-wont-open', 'When to Call a Professional', 1],
  ['prepare-for-power-outage-home', 'garage-door-wont-open', 'Restore in the right order', 0],

  // 8 · ceiling water stain
  ['recaulk-bathtub', 'water-stain-on-ceiling', 'Troubleshooting a Failed Bead'],
  ['patch-hole-in-drywall', 'water-stain-on-ceiling', 'Sand, prime, and paint'],
  ['prevent-frozen-pipes', 'water-stain-on-ceiling', 'Prevent the next freeze', 3],

  // 9 · moisture before mold
  ['remove-mold-bathroom-caulk', 'find-moisture-problems-early', 'Dry and Prevent Recurrence'],
  ['reduce-dust-in-home', 'find-moisture-problems-early', 'Control Humidity'],
  ['winterize-your-home-complete-guide', 'find-moisture-problems-early', 'roof and attic heat'],

  // 10 · DIY or pro
  ['fix-leaky-faucet', 'diy-or-call-a-professional', 'When to Replace the Faucet Instead'],
  ['reset-tripped-circuit-breaker', 'diy-or-call-a-professional', 'When to Stop and Call an Electrician'],
  ['fix-window-wont-open', 'diy-or-call-a-professional', 'When to Call a Professional'],
  ['unclog-toilet', 'diy-or-call-a-professional', 'If the Clog Is Past the Toilet'],
];

// ---- 变体轮换：同一目标的第 n 次出现用第 n 套文案，可被配对第 4 项强制指定 ----
const variantCursor = new Map();
const variantOf = (target, forced) => {
  if (typeof forced === 'number') return TARGETS[target].variants[forced];
  const list = TARGETS[target].variants;
  const i = variantCursor.get(target) || 0;
  variantCursor.set(target, i + 1);
  return list[Math.min(i, list.length - 1)];
};

const CAT_ROUTE = {
  'Fix It': 'fix-it',
  'Save Money': 'save-money',
  'Home Hacks': 'home-hacks',
  'Kitchen Tips': 'kitchen-tips',
  Organize: 'organize',
  'Seasonal & Holiday': 'seasonal',
};
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const STOP = new Set([
  'the', 'and', 'for', 'with', 'your', 'from', 'that', 'this', 'into', 'when', 'what',
  'how', 'why', 'its', 'you', 'are', 'not', 'but', 'they', 'them', 'than', 'then',
  'without', 'before', 'after', 'over', 'under', 'more', 'less', 'every', 'does',
  'will', 'would', 'floor', 'across',
]);

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
for (const [t, def] of Object.entries(TARGETS)) {
  if (def.variants.length < (targetCount.get(t) || 0)) {
    throw new Error(`${t} 需要 ${targetCount.get(t)} 套文案，实际只有 ${def.variants.length} 套`);
  }
}

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

function pickSection(lines, target, hint, anchor) {
  const secs = sections(lines);
  if (hint) {
    const re = new RegExp(hint, 'i');
    const hit = secs.find((s) => re.test(s.title));
    if (!hit) throw new Error(`${target} 的小节提示未命中：${hint}`);
    return { section: hit, score: 99 };
  }

  const words = `${meta(read(target), 'title')} ${anchor}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
  const uniq = [...new Set(words)];
  let best = secs[secs.length - 1];
  let bestScore = -1;
  for (const s of secs) {
    const body = lines.slice(s.start, s.end).join(' ');
    const head = s.title.toLowerCase();
    let score = 0;
    for (const w of uniq) {
      if (head.includes(w)) score += 4;
      const n = (body.toLowerCase().match(new RegExp(`\\b${w}`, 'g')) || []).length;
      score += Math.min(n, 6);
    }
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return { section: best, score: bestScore };
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
  const { section, score } = pickSection(lines, target, hint, variant.anchor);
  let cut = section.end;
  const trimBlank = () => {
    while (cut > section.start && lines[cut - 1].trim() === '') cut--;
  };
  trimBlank();
  // 文章用小节间的 --- 作分隔线，句子要落在分隔线之前，属于当前小节
  if (cut > section.start && /^-{3,}$/.test(lines[cut - 1].trim())) {
    cut--;
    trimBlank();
  }
  const sentence = variant.sentence.replace('{link}', `[${variant.anchor}](${link})`);
  lines.splice(cut, 0, '', sentence);
  const out = head + lines.join(eol);
  log.push(`${String(score).padStart(3)}  ${host} → ${target}  @ 「${section.title}」`);
  if (!DRY) fs.writeFileSync(path.join(DIR, `${host}.md`), out);
  changed++;
}

console.log(log.join('\n'));
console.log(`\n${DRY ? '[dry] 计划' : '已写入'} ${changed} 条，跳过 ${PAIRS.length - changed} 条`);
