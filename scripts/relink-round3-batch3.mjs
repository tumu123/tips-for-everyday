/**
 * 第三轮批次 3 内链回填：老文 → 8 篇 Home Hacks 新文
 *
 * 与批次 1、2 同一套逻辑：每条配对指定「宿主」与「目标」，
 * 脚本在宿主最相关的小节末尾补一句带内链的话。
 * 每个目标配 3–4 套文案轮换，避免同一句话在多篇里重复。
 *
 * 约束：每个宿主最多 2 条，每个新文至少 2 条。
 *
 * 用法：
 *   node scripts/relink-round3-batch3.mjs --dry
 *   node scripts/relink-round3-batch3.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const DRY = process.argv.includes('--dry');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');

const TARGETS = {
  'wash-curtains-without-shrinking': {
    variants: [
      {
        anchor: 'washing curtain panels without shrinking them',
        sentence:
          'Curtains sit on a different schedule and need a different method entirely — {link} covers the fabric test that decides whether a panel can be washed at all.',
      },
      {
        anchor: 'the fabric side of the same dust problem',
        sentence:
          'The frames and the fabric above them collect the same dust — {link} covers the panel side, where heat rather than water is what does the damage.',
      },
      {
        anchor: 'washing a panel without shrinking it',
        sentence:
          'The same mineral film settles on anything that stays wet, including the fabric beside the window — {link} covers how to wash a curtain without losing its length.',
      },
    ],
  },
  'clean-carpet-without-rental-machine': {
    variants: [
      {
        anchor: 'cleaning a whole carpet without a machine',
        sentence:
          'Once the spots are handled, the carpet still holds everything the spots did not — {link} covers the full-surface method that dries in hours rather than days.',
      },
      {
        anchor: 'the same over-wetting problem on carpet',
        sentence:
          'Cushions dry faster than a floor does, and that is the only reason over-wetting is more forgiving there — {link} applies the same low-moisture logic to a whole room.',
      },
      {
        anchor: 'deep cleaning carpet properly',
        sentence:
          'The same rule applies to the floor the bed sits on — {link} covers why too much water, not too little, is what ruins a soft surface.',
      },
    ],
  },
  'how-often-to-wash-pillows': {
    variants: [
      {
        anchor: 'washing pillows on the same schedule',
        sentence:
          'The pillow on top of it accumulates the same material faster — {link} covers the filling-by-filling method and the interval a protector buys you.',
      },
      {
        anchor: 'why a damp filling always smells',
        sentence:
          'The same rule decides whether a pillow survives washing — {link} covers the drying test that separates a clean pillow from a sour one.',
      },
      {
        anchor: 'washing pillows without ruining the filling',
        sentence:
          'Pillowcases take the stains; the pillow underneath takes everything else — {link} covers what can be washed and what cannot go near water.',
      },
    ],
  },
  'wash-duvet-or-comforter': {
    variants: [
      {
        anchor: 'washing a duvet or comforter at home',
        sentence:
          'Bedding is the load that stresses a machine most, and it is also the one most often washed in a drum too small for it — {link} starts with the capacity check.',
      },
      {
        anchor: 'whether the duvet itself can be washed',
        sentence:
          'Some marks are on the cover and some are in the filling, and they need different answers — {link} covers the second case, including when washing is not an option.',
      },
      {
        anchor: 'drying a duvet completely',
        sentence:
          'Storage is where a badly dried duvet gives itself away — {link} covers the drying test that has to pass before anything goes in a cupboard.',
      },
    ],
  },
  'remove-hard-water-faucets-showerheads': {
    variants: [
      {
        anchor: 'the same mineral film inside the fixtures',
        sentence:
          'The glass is the visible version of a deposit that also forms inside the plumbing — {link} covers the soak method for aerators and showerheads.',
      },
      {
        anchor: 'descaling the fixtures that feed the bowl',
        sentence:
          'The bowl is downstream of the same water, and the fixtures upstream scale first — {link} covers the acid soak and the finishes that cannot survive it.',
      },
      {
        anchor: 'the same scale on the fixtures',
        sentence:
          'Anything that heats water scales faster than a showerhead does — {link} covers the fixtures, where a thirty-minute soak is the whole repair.',
      },
    ],
  },
  'clean-walls-doors-switches': {
    variants: [
      {
        anchor: 'the surfaces above the baseboard',
        sentence:
          'Baseboards are the visible line, but the wall above them and the door frames beside them take more hand contact — {link} covers the finish test that decides what can be washed.',
      },
      {
        anchor: 'the frames and the wall around them',
        sentence:
          'The track is the worst part of the frame, and the painted surfaces around it need a different method — {link} covers the sheen test that decides whether you can rub at all.',
      },
      {
        anchor: 'walls and doors in the cooking zone',
        sentence:
          'Cabinets are only part of what aerosolised grease lands on — {link} covers the walls and doors on the same circuit, where the paint finish limits the method.',
      },
    ],
  },
  'remove-pet-hair-everywhere': {
    variants: [
      {
        anchor: 'removing the hair before cleaning the carpet',
        sentence:
          'Hair and urine are two problems on the same carpet, and the hair has to come out first — {link} covers the mechanical method and why liquids make it worse.',
      },
      {
        anchor: 'getting hair out of upholstery',
        sentence:
          'A washable cover solves the hair problem as well as the stain problem — {link} covers the tool that works on the fabric underneath when there is no cover.',
      },
      {
        anchor: 'the hair that never leaves the room',
        sentence:
          'Pet hair is a dust reservoir as much as a visible mess — {link} covers the removal method for every surface, from carpet to car seats.',
      },
    ],
  },
  'improve-indoor-air-without-gadgets': {
    variants: [
      {
        anchor: 'the same problem before the filter stage',
        sentence:
          'The duct and filter path is one of four layers, and it is the last one that matters — {link} covers the source-control and ventilation layers that come before it.',
      },
      {
        anchor: 'the hood as an air quality device',
        sentence:
          'A hood that recirculates is a grease filter, not an exhaust — {link} covers what that means for particles and combustion gases in the kitchen.',
      },
      {
        anchor: 'what the fan is actually moving',
        sentence:
          'A ceiling fan moves air without cleaning it, and the dust it keeps airborne has to settle somewhere — {link} covers the sequence that removes it at the source first.',
      },
      {
        anchor: 'ventilation as the fix for damp air',
        sentence:
          'Moisture and particles are separate problems with separate fixes, and this is the particle side — {link} covers ventilation timing and the filter rating that actually helps.',
      },
    ],
  },
};

const PAIRS = [
  // 1 · curtains
  ['clean-blinds-without-removing', 'wash-curtains-without-shrinking', 'How Often to Do It', 0],
  ['clean-window-tracks', 'wash-curtains-without-shrinking', 'Step 7: Keep It Cleaner for Longer', 1],
  ['remove-hard-water-stains-shower-door', 'wash-curtains-without-shrinking', 'Preventing Hard Water Stains Next Time', 2],

  // 2 · carpet
  ['remove-pet-urine-stains-carpet', 'clean-carpet-without-rental-machine', 'Preventing Repeat Marking', 0],
  ['clean-upholstery-couch-stains', 'clean-carpet-without-rental-machine', '5. Dry It Properly', 1],
  ['deep-clean-mattress', 'clean-carpet-without-rental-machine', 'Preventing Mattress Buildup', 2],

  // 3 · pillows
  ['deep-clean-mattress', 'how-often-to-wash-pillows', 'Step 6: Rotate and Protect', 0],
  ['remove-mildew-smell-laundry', 'how-often-to-wash-pillows', 'Step 3: Fix the drying', 1],
  ['remove-laundry-stains', 'how-often-to-wash-pillows', 'Step 6: Prevent the next stain from setting', 2],

  // 4 · duvet
  ['how-to-clean-washing-machine', 'wash-duvet-or-comforter', 'Preventing Odor and Buildup', 0],
  ['remove-laundry-stains', 'wash-duvet-or-comforter', 'Step 5: When to escalate', 1],
  ['remove-mildew-smell-laundry', 'wash-duvet-or-comforter', 'Step 4: Fix the storage', 2],

  // 5 · hard water fixtures
  ['remove-hard-water-stains-shower-door', 'remove-hard-water-faucets-showerheads', 'Why This Works', 0],
  ['remove-toilet-bowl-hard-water-ring', 'remove-hard-water-faucets-showerheads', 'Step 6: Address the Water', 1],
  ['descale-kettle-coffee-maker', 'remove-hard-water-faucets-showerheads', 'Preventing Scale Buildup', 2],

  // 6 · walls and switches
  ['clean-baseboards-quickly', 'clean-walls-doors-switches', 'Step 7: Keep Them Cleaner Between Deep Cleans', 0],
  ['clean-window-tracks', 'clean-walls-doors-switches', 'Step 7: Keep It Cleaner for Longer', 1],
  ['grease-stains-kitchen-cabinets', 'clean-walls-doors-switches', 'Preventing Grease Buildup', 2],

  // 7 · pet hair
  ['remove-pet-urine-stains-carpet', 'remove-pet-hair-everywhere', 'Preventing Repeat Marking', 0],
  ['clean-upholstery-couch-stains', 'remove-pet-hair-everywhere', '6. Covers, Cushions, and When to Stop', 1],
  ['reduce-dust-in-home', 'remove-pet-hair-everywhere', '5. Handle Pets and People', 2],

  // 8 · indoor air
  ['reduce-dust-in-home', 'improve-indoor-air-without-gadgets', '3. Fix the HVAC Path', 0],
  ['clean-range-hood-filters', 'improve-indoor-air-without-gadgets', 'Step 7: Address the Ducting and Motor', 1],
  ['clean-ceiling-fan-blades-no-dust', 'improve-indoor-air-without-gadgets', 'Step 6: Slow the Next Layer Down', 2],
  ['remove-mold-bathroom-caulk', 'improve-indoor-air-without-gadgets', 'Step 6: Dry and Prevent Recurrence', 3],
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
  if (cut > section.start && /^-{3,}$/.test(lines[cut - 1].trim())) {
    cut--;
    trimBlank();
  }
  const sentence = variant.sentence.replace('{link}', `[${variant.anchor}](${link})`);
  lines.splice(cut, 0, '', sentence);
  const out = head + lines.join(eol);
  log.push(`${host} → ${target}  @ 「${section.title}」`);
  if (!DRY) fs.writeFileSync(path.join(DIR, `${host}.md`), out);
  changed++;
}

console.log(log.join('\n'));
console.log(`\n${DRY ? '[dry] 计划' : '已写入'} ${changed} 条`);
