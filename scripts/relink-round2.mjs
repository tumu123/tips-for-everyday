/**
 * 第三轮内链回填：老文 → 第二轮 60 篇新文
 *
 * 每条配对指定「宿主文章」与「目标文章」，脚本自动在宿主正文里挑选最相关的小节，
 * 在该小节末尾补一句带内链的话。锚文本与句子按目标文章写定，避免机械重复。
 *
 * 用法：
 *   node scripts/relink-round2.mjs --dry    # 只打印计划，不改文件
 *   node scripts/relink-round2.mjs          # 写入
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const DRY = process.argv.includes('--dry');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');

/** 目标文章：锚文本 + 句子（{link} 会被替换成 Markdown 链接） */
const TARGETS = {
  'fix-cracked-grout-regrout': {
    anchor: 'regrouting cracked grout',
    sentence: 'Once grout is cracked rather than stained, no amount of cleaning holds it — see {link} for the regrouting sequence.',
  },
  'fix-drafts-from-electrical-outlets': {
    anchor: 'sealing drafty outlets',
    sentence: 'Outlets and switches on exterior walls are the leaks most people miss; {link} covers how to seal them safely.',
  },
  'fix-dripping-shower-valve': {
    anchor: 'replacing a dripping shower valve',
    sentence: 'If the drip continues with the handle fully off, the cartridge is worn — {link} walks through the swap.',
  },
  'fix-garbage-disposal-leaking': {
    anchor: 'fixing a leaking garbage disposal',
    sentence: 'When water appears under the sink only after the disposal runs, the leak is in the unit itself — {link} narrows down which joint it is.',
  },
  'fix-loose-cabinet-hinges-drawers': {
    anchor: 'tightening loose cabinet hinges and drawer fronts',
    sentence: 'Doors that sag and drawers that rub are usually the same problem — {link} covers the screw, anchor, and adjustment fixes.',
  },
  'fix-low-water-pressure-faucet': {
    anchor: 'restoring pressure at a single faucet',
    sentence: 'Low pressure at one faucet is a different fault from low pressure everywhere — {link} separates the two.',
  },
  'fix-outdoor-faucet-leaking-winter': {
    anchor: 'an outdoor faucet that leaks after a freeze',
    sentence: 'A hose bib that drips indoors every spring has usually split behind the wall — see {link} before the next freeze.',
  },
  'fix-sliding-patio-door-sticking': {
    anchor: 'getting a sliding patio door to glide again',
    sentence: 'Rollers, track, and alignment fail in that order — {link} has the test for each.',
  },
  'fix-toilet-rocking-on-floor': {
    anchor: 'stopping a toilet that rocks',
    sentence: 'A rocking toilet stresses the wax seal until it leaks — {link} covers the flange and shim fix.',
  },
  'stop-water-hammer-noisy-pipes': {
    anchor: 'stopping water hammer',
    sentence: 'The bang when a tap closes is a pressure shock, not a loose pipe — {link} covers the arrestor and the cheaper fixes.',
  },
  'batch-cooking-save-money-time': {
    anchor: 'batch cooking to cut the grocery bill',
    sentence: 'Cooking two or three components at once is the cheapest way to stop ordering out — {link} sets out the weekly rhythm.',
  },
  'cheaper-lawn-care-without-a-service': {
    anchor: 'caring for a lawn without a service contract',
    sentence: 'Most lawn contracts bill for mowing and little else — {link} covers what actually keeps grass healthy.',
  },
  'cut-standby-power-vampire-draw': {
    anchor: 'cutting standby power draw',
    sentence: 'Standby loads are small per device and large per house — {link} shows which ones are worth unplugging.',
  },
  'dishwasher-vs-hand-washing-cost': {
    anchor: 'whether the dishwasher or hand washing costs less',
    sentence: 'The answer depends on how you heat water and how you run the tap — {link} does the arithmetic.',
  },
  'lower-homeowners-insurance-premium': {
    anchor: 'lowering a homeowners insurance premium',
    sentence: 'Premiums move with the roof, the claims history, and the deductible — {link} lists what actually shifts the number.',
  },
  'lower-internet-bill-without-switching': {
    anchor: 'cutting an internet bill without switching providers',
    sentence: 'Retention pricing and equipment fees do most of the work — {link} has the script and the order to ask in.',
  },
  'save-money-on-bedding-and-linens': {
    anchor: 'buying bedding that lasts',
    sentence: 'Thread count is the least useful number on the label — {link} covers what to check instead.',
  },
  'save-money-on-pest-control-diy': {
    anchor: 'handling common household pests yourself',
    sentence: 'Perimeter work prevents more than spraying — {link} also covers the cases worth paying a professional for.',
  },
  'save-money-when-moving-house': {
    anchor: 'keeping a move cheap',
    sentence: 'Moves get expensive in the packing and the last trip, not the truck — {link} covers both.',
  },
  'water-heater-temperature-setting-savings': {
    anchor: 'setting the water heater temperature',
    sentence: 'Most tanks ship at 140°F, and 120°F is safe for an adult household — {link} covers the trade-offs.',
  },
  'clean-baseboards-quickly': {
    anchor: 'cleaning baseboards without crawling the floor',
    sentence: 'Baseboards collect dust that then redistributes itself — {link} has the tool and the order.',
  },
  'clean-ceiling-fan-blades-no-dust': {
    anchor: 'cleaning fan blades without dust falling',
    sentence: 'The pillowcase method contains the dust instead of spreading it — {link} covers the sequence.',
  },
  'clean-dishwasher-filter': {
    anchor: 'cleaning the dishwasher filter',
    sentence: 'A clogged filter is the usual reason glasses come out gritty — {link} covers the monthly routine.',
  },
  'clean-leather-furniture': {
    anchor: 'cleaning and conditioning leather furniture',
    sentence: 'Leather cracks because it dries, not because it is dirty — {link} covers both sides of that.',
  },
  'clean-microwave-easily': {
    anchor: 'cleaning a microwave with steam',
    sentence: 'Ten minutes of steam does more than twenty minutes of scrubbing — {link} has the sequence.',
  },
  'clean-oven-without-self-clean': {
    anchor: 'cleaning an oven without the self-clean cycle',
    sentence: 'Self-clean runs are hard on elements and racks — {link} covers the manual method.',
  },
  'clean-upholstery-couch-stains': {
    anchor: 'cleaning upholstery stains',
    sentence: 'The fabric code decides which solvent you can use at all — {link} starts there.',
  },
  'clean-window-tracks': {
    anchor: 'cleaning window tracks',
    sentence: 'Tracks hold water and grit against the frame — {link} covers the extraction step most people skip.',
  },
  'reduce-dust-in-home': {
    anchor: 'reducing dust at the source',
    sentence: 'Filtration helps and source control helps more — {link} covers both.',
  },
  'remove-toilet-bowl-hard-water-ring': {
    anchor: 'removing a hard water ring from a toilet bowl',
    sentence: 'The ring is mineral scale, so acid does the work — {link} covers it safely.',
  },
  'cook-rice-so-it-turns-out-right': {
    anchor: 'cooking rice by ratio and rest time',
    sentence: 'Rice fails on ratio, lid, and rest — {link} covers all three by grain type.',
  },
  'get-more-out-of-grocery-leftovers': {
    anchor: 'turning leftovers into new meals',
    sentence: 'Change the carrier, the temperature, or the cuisine — {link} shows the pattern.',
  },
  'keep-ginger-garlic-fresh-longer': {
    anchor: 'keeping ginger, garlic and chilies usable',
    sentence: 'Ginger dries, garlic sprouts, and chilies mold — {link} covers a different setup for each.',
  },
  'keep-kitchen-sponges-clean': {
    anchor: 'keeping sponges and dishcloths sanitary',
    sentence: 'Drying between uses matters more than any disinfecting trick — {link} covers the rest.',
  },
  'prevent-freezer-burn-on-meat': {
    anchor: 'preventing freezer burn on meat',
    sentence: 'Surface dehydration and fat oxidation are the two failures — {link} covers both.',
  },
  'store-butter-and-margarine': {
    anchor: 'where butter belongs',
    sentence: 'Salted, unsalted, and cultured butter keep on different clocks — {link} sorts them out.',
  },
  'store-eggs-how-long-they-last': {
    anchor: 'how long eggs actually keep',
    sentence: 'Refrigerated eggs hold far longer than the carton date suggests — {link} covers the float test and the limits.',
  },
  'store-nuts-seeds-and-flours': {
    anchor: 'storing nuts, seeds and flour',
    sentence: 'The oils in nuts and whole grains go rancid at room temperature — {link} covers the freezer cases.',
  },
  'store-onions-potatoes-garlic': {
    anchor: 'storing onions, potatoes and garlic',
    sentence: 'They need dry air and separation, not the fridge — {link} covers the setup.',
  },
  'wash-fruit-vegetables-properly': {
    anchor: 'washing produce properly',
    sentence: 'Rinsing under the tap does less than most people assume — {link} covers the cases that need more.',
  },
  'organize-kids-school-papers-artwork': {
    anchor: "dealing with kids' school papers and artwork",
    sentence: 'The one-year test settles most of it — {link} covers the rest.',
  },
  'organize-linen-closet': {
    anchor: 'organizing a linen closet by set',
    sentence: 'Sheets stay matched when they are stored as sets — {link} covers the fold.',
  },
  'organize-sentimental-items': {
    anchor: 'storing sentimental items without keeping everything',
    sentence: 'Photograph it, keep one, and store by material — {link} covers the method.',
  },
  'labeling-systems-that-last': {
    anchor: 'labeling so a system survives',
    sentence: 'Label only what needs a decision on the way back — {link} covers the rest.',
  },
  'organize-tools-in-a-drawer': {
    anchor: 'organizing tools without a workshop',
    sentence: 'Sort by frequency rather than type — {link} covers the three tiers.',
  },
  'organize-laundry-room': {
    anchor: 'organizing a laundry room around the work flow',
    sentence: 'Sort, wash, dry, fold, and put away are five separate stations — {link} covers the layout.',
  },
  'organize-craft-hobby-supplies': {
    anchor: 'organizing craft supplies',
    sentence: 'Half-finished projects are the real problem — {link} covers project boxes.',
  },
  'organize-medicine-cabinet': {
    anchor: 'organizing a medicine cabinet safely',
    sentence: 'The bathroom is the worst room in the house for most medicines — {link} covers safer storage.',
  },
  'organize-reusable-bags-and-wraps': {
    anchor: 'keeping reusable bags under control',
    sentence: 'Six bags is the practical limit for most households — {link} covers the fold.',
  },
  'store-shoes-in-a-small-entry': {
    anchor: 'storing shoes without an entry closet',
    sentence: 'Capacity depends on depth rather than width — {link} covers the measurements.',
  },
  'new-year-home-reset': {
    anchor: 'a new year home reset that is not a declutter',
    sentence: 'Audit the systems, not the rooms — {link} covers the checklist.',
  },
  'prepare-guest-room-and-bath-for-visitors': {
    anchor: 'preparing a guest room and bath',
    sentence: 'Guests notice the route to the bathroom at two in the morning — {link} covers the details.',
  },
  'winter-holiday-safety-home-checks': {
    anchor: 'holiday safety checks for lights, trees, candles and heaters',
    sentence: 'Four ignition sources in one room compound — {link} covers each.',
  },
  'fall-yard-and-gutter-cleanup': {
    anchor: 'fall gutter and yard cleanup',
    sentence: 'An inch of rain on a roof is hundreds of gallons — {link} covers the drainage order.',
  },
  'leave-home-for-vacation-checklist': {
    anchor: 'the checklist for leaving a house empty',
    sentence: 'The risk is the length of the absence, not the leaving — {link} covers the shutdown.',
  },
  'prepare-for-power-outage-home': {
    anchor: 'preparing for a power outage',
    sentence: 'The four-hour, eight-hour, and twenty-four-hour marks each break something different — {link} covers all three.',
  },
  'prepare-home-for-hurricane-season': {
    anchor: 'preparing a house for hurricane season',
    sentence: 'Wind pressure and storm surge are separate problems — {link} covers both.',
  },
  'prepare-home-for-winter-storm': {
    anchor: 'preparing for a winter storm',
    sentence: 'Snow load, ice dams, and heat loss are the three failures — {link} covers them.',
  },
  'spring-outdoor-cleanup-checklist': {
    anchor: 'spring outdoor cleanup in the right order',
    sentence: 'Drainage comes first and washing comes second — {link} covers the sequence.',
  },
  'summer-home-maintenance-checklist': {
    anchor: 'summer maintenance checks',
    sentence: 'The condensate line is the season\u2019s biggest service call — {link} covers it.',
  },
};

/** 宿主 → 目标（每个老文最多 2 条，每个新文至少 2 条） */
// ===== 配对数据与执行逻辑 =====
const PAIRS = JSON.parse(fs.readFileSync('scripts/relink-pairs.json', 'utf8'));

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
if (overHost.length) console.log('⚠ 宿主超过 2 条：', overHost.map(([h, n]) => `${h}(${n})`).join(', '));
if (thinTarget.length) console.log('⚠ 目标不足 2 条：', thinTarget.join(', '));

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

function pickSection(lines, target, hint) {
  const secs = sections(lines);
  if (hint) {
    const re = new RegExp(hint, 'i');
    const hit = secs.find((s) => re.test(s.title));
    if (!hit) throw new Error(`${target} 的小节提示未命中：${hint}`);
    return { section: hit, score: 99 };
  }

  const words = `${meta(read(target), 'title')} ${TARGETS[target].anchor}`
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
for (const [host, target, hint] of PAIRS) {
  const src = read(host);
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const link = pathOf(target);
  if (src.includes(`](${link})`)) {
    log.push(`skip  ${host} → ${target}（已有链接）`);
    continue;
  }
  const fmEnd = src.indexOf('---', 3);
  const head = src.slice(0, src.indexOf('\n', fmEnd) + 1);
  const bodyRaw = src.slice(head.length);
  const lines = bodyRaw.split(/\r?\n/);
  const { section, score } = pickSection(lines, target, hint);
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
  const sentence = TARGETS[target].sentence.replace('{link}', `[${TARGETS[target].anchor}](${link})`);
  lines.splice(cut, 0, '', sentence);
  const out = head + lines.join(eol);
  log.push(`${String(score).padStart(3)}  ${host} → ${target}  @ 「${section.title}」`);
  if (!DRY) fs.writeFileSync(path.join(DIR, `${host}.md`), out);
  changed++;
}

console.log(log.join('\n'));
console.log(`\n${DRY ? '[dry] 计划' : '已写入'} ${changed} 条，跳过 ${PAIRS.length - changed} 条`);
