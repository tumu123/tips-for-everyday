/**
 * 第三轮批次 2 内链回填：老文 → 10 篇 Save Money 新文
 *
 * 与批次 1 同一套逻辑：每条配对指定「宿主」与「目标」，
 * 脚本在宿主最相关的小节末尾补一句带内链的话。
 * 每个目标配 3–4 套文案轮换，避免同一句话在多篇里重复。
 *
 * 约束：每个宿主最多 2 条，每个新文至少 2 条。
 *
 * 用法：
 *   node scripts/relink-round3-batch2.mjs --dry
 *   node scripts/relink-round3-batch2.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const DRY = process.argv.includes('--dry');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');

const TARGETS = {
  'file-home-insurance-claim': {
    variants: [
      {
        anchor: 'filing the claim properly',
        sentence:
          'Deciding not to file is only half the strategy — {link} covers what to photograph, what to say to the adjuster, and why the first day decides most of the payout.',
      },
      {
        anchor: 'how a claim is actually documented',
        sentence:
          'If the damage reaches the point of a claim, the stain is the least expensive part of the problem — {link} walks it from mitigation to the second depreciation check.',
      },
      {
        anchor: 'what decides whether the damage is covered',
        sentence:
          'Coverage turns on the cause of loss rather than on the cost of the repair — {link} explains how the cause gets documented and what an adjuster checks it against.',
      },
    ],
  },
  'appeal-property-tax-assessment': {
    variants: [
      {
        anchor: 'the assessment behind the tax',
        sentence:
          'The premium is only one number the county sets — {link} covers the other, and the short window for disagreeing with it.',
      },
      {
        anchor: 'appealing a property tax assessment',
        sentence:
          'One annual line worth an hour of attention is the value the property tax is calculated from — {link} covers how to check it against comparable sales without a lawyer.',
      },
      {
        anchor: 'checking what the assessor has recorded',
        sentence:
          'Property tax is set locally and follows the address — {link} covers the factual errors worth correcting and the appeal window that closes quickly.',
      },
      {
        anchor: 'the property tax line',
        sentence:
          'Property tax is the largest recurring tax most households pay and the one they review least — {link} covers the two numbers on the notice and which one can be appealed.',
      },
    ],
  },
  'cost-to-hire-out-vs-diy': {
    variants: [
      {
        anchor: 'pricing out and doing it yourself',
        sentence:
          'This rule is about consequences rather than difficulty, which is the same test {link} applies to the money — saved labour divided by hours spent.',
      },
      {
        anchor: 'the real cost of doing it yourself',
        sentence:
          'Doing the work yourself removes the labour line and adds the tool, waste, permit, and weekend lines — {link} prices both sides.',
      },
      {
        anchor: 'when a contract beats doing it yourself',
        sentence:
          'A contract is not automatically more expensive than the work you could do yourself — {link} shows where the effective hourly rate makes DIY irrational and where it pays well.',
      },
      {
        anchor: 'the effective hourly rate of DIY',
        sentence:
          'Before deciding to attempt it, price the hours — {link} turns the comparison into a rate you can hold against your own wage.',
      },
    ],
  },
  'buying-refurbished-appliances': {
    variants: [
      {
        anchor: 'buying the replacement refurbished',
        sentence:
          'If the replacement will be a used or refurbished unit, the warranty is the whole decision — {link} separates factory recertified from a wiped-down return.',
      },
      {
        anchor: 'what a refurbished warranty covers',
        sentence:
          'Keeping a machine alive is one way to avoid the purchase; buying the replacement at half price is the other — {link} covers what the warranty on that unit actually covers.',
      },
      {
        anchor: 'buying a used appliance',
        sentence:
          'The used market for appliances carries the same traps as the used market for furniture, plus a compressor — {link} covers the discount that justifies the risk.',
      },
    ],
  },
  'heat-pump-vs-furnace': {
    variants: [
      {
        anchor: 'heat pump versus furnace',
        sentence:
          'If the heating system is near the end of its life, the replacement sets fifteen years of bills — {link} compares them in dollars per million BTU rather than efficiency ratings.',
      },
      {
        anchor: 'comparing heating systems honestly',
        sentence:
          'Heating is the largest single load in most audits, and which system produces it changes everything downstream — {link} works the comparison from fuel price and climate.',
      },
      {
        anchor: 'what the heating fuel actually costs',
        sentence:
          'Sealing the envelope lowers the load, but it does not change the fuel — {link} covers what each heating system costs per unit of heat delivered.',
      },
    ],
  },
  'solar-panel-payback': {
    variants: [
      {
        anchor: 'whether solar ever pays back',
        sentence:
          'Before investing in generation, price what the loads actually cost — {link} runs the four numbers that decide whether a system pays for itself.',
      },
      {
        anchor: 'the solar payback calculation',
        sentence:
          'The payback logic that decides a light bulb also decides a roof full of panels — {link} does the arithmetic without the twenty-five-year savings headline.',
      },
      {
        anchor: 'when solar is worth the money',
        sentence:
          'An audit tells you what to fix, and generation is the expensive way to fix it — {link} covers when panels earn their keep and when the export tariff kills the case.',
      },
    ],
  },
  'lower-cell-phone-bill': {
    variants: [
      {
        anchor: 'cutting the phone bill',
        sentence:
          'The phone account is the bill most people never renegotiate and the easiest one to cut — {link} splits it into service, device, and add-ons before anything changes.',
      },
      {
        anchor: 'the device payment on a phone bill',
        sentence:
          'Equipment rental is not the only recurring charge worth questioning — {link} applies the same logic to the phone account, where the device payment is usually the largest line.',
      },
    ],
  },
  'audit-forgotten-subscriptions': {
    variants: [
      {
        anchor: 'a subscription audit',
        sentence:
          'The monthly review surfaces charges as they appear, but a dedicated pass finds more — {link} works from twelve months of statements rather than memory.',
      },
      {
        anchor: 'finding recurring charges you forgot',
        sentence:
          'Standby draw is the invisible cost on the electricity side; recurring charges are the invisible cost on the banking side — {link} finds them in one sitting.',
      },
      {
        anchor: 'auditing subscriptions before renegotiating',
        sentence:
          'Negotiating a bill assumes you know what you are paying — {link} is the step before that, and it usually finds more than the call does.',
      },
    ],
  },
  'why-electric-bill-jumped': {
    variants: [
      {
        anchor: 'why the bill jumped',
        sentence:
          'If the change is in usage rather than rate, something is running that was not running before — {link} separates weather, billing days, rate changes, and a single new load.',
      },
      {
        anchor: 'a bill that rose with the temperature',
        sentence:
          'Cooling is the load that moves most in summer, and a system that lost capacity shows up on the bill before it shows up in comfort — {link} covers how to tell that apart from a hot month.',
      },
      {
        anchor: 'diagnosing an unexpected bill',
        sentence:
          'The difference between a high bill and a wrong bill is arithmetic — {link} starts from kWh per day and degree days before touching a single appliance.',
      },
    ],
  },
  'time-of-use-electricity-plan': {
    variants: [
      {
        anchor: 'time-of-use pricing',
        sentence:
          'Running full loads matters less than when they run once the tariff has peak pricing — {link} covers whether the switch pays for your load shape.',
      },
      {
        anchor: 'whether a time-of-use plan suits this house',
        sentence:
          'Line drying saves money on any tariff; on a time-of-use plan the timing matters as much as the choice to skip the dryer — {link} covers the plan side of that decision.',
      },
      {
        anchor: 'peak and off-peak pricing',
        sentence:
          'Once the standby load is measured, the next question is what it costs by the hour — {link} explains when the hours are priced differently and whether that helps.',
      },
    ],
  },
};

const PAIRS = [
  // 1 · insurance claim
  ['lower-homeowners-insurance-premium', 'file-home-insurance-claim', 'Stop Filing Small Claims', 0],
  ['water-stain-on-ceiling', 'file-home-insurance-claim', 'Step 7: Insurance and Documentation', 1],
  ['prepare-for-power-outage-home', 'file-home-insurance-claim', 'Step 3: Protect the basement before the storm', 2],

  // 2 · property tax
  ['lower-homeowners-insurance-premium', 'appeal-property-tax-assessment', '1. Understand What Actually Sets the Number', 0],
  ['track-household-spending', 'appeal-property-tax-assessment', 'Step 4: The Monthly Review', 1],
  ['save-money-when-moving-house', 'appeal-property-tax-assessment', '6. Avoid the Costs That Hide', 2],

  // 3 · hire out vs DIY
  ['diy-or-call-a-professional', 'cost-to-hire-out-vs-diy', 'Permits and Insurance', 0],
  ['cheaper-lawn-care-without-a-service', 'cost-to-hire-out-vs-diy', '6. What You Can Usually Stop Paying For', 1],
  ['save-money-on-pest-control-diy', 'cost-to-hire-out-vs-diy', 'Step 5: Treat Only Where It Is Actually Needed', 2],
  ['fix-leaky-faucet', 'cost-to-hire-out-vs-diy', 'When to Replace the Faucet Instead', 3],

  // 4 · refurbished appliances
  ['repair-or-replace-appliance', 'buying-refurbished-appliances', 'Before You Replace', 0],
  ['extend-life-of-appliances', 'buying-refurbished-appliances', 'Why This Works', 1],
  ['buy-used-furniture-safely', 'buying-refurbished-appliances', 'The On-Site Inspection', 2],

  // 5 · heat pump vs furnace
  ['save-on-heating-costs-winter', 'heat-pump-vs-furnace', 'The Ranked List', 0],
  ['home-energy-audit-diy', 'heat-pump-vs-furnace', 'Step 6: Check the HVAC System', 1],
  ['cheap-window-insulation', 'heat-pump-vs-furnace', 'How Much This Saves', 2],

  // 6 · solar payback
  ['cut-electricity-bill-without-spending-money', 'solar-panel-payback', '15. Monitor Your Usage', 0],
  ['led-vs-incandescent-cost', 'solar-panel-payback', 'The Honest Caveats', 1],
  ['home-energy-audit-diy', 'solar-panel-payback', 'When to Call a Professional', 2],

  // 7 · cell phone
  ['negotiate-household-bills', 'lower-cell-phone-bill', 'Bill-by-Bill Tactics', 0],
  ['lower-internet-bill-without-switching', 'lower-cell-phone-bill', '1. Stop Renting the Equipment', 1],

  // 8 · subscriptions
  ['track-household-spending', 'audit-forgotten-subscriptions', 'Step 4: The Monthly Review', 0],
  ['cut-standby-power-vampire-draw', 'audit-forgotten-subscriptions', 'Do Not Confuse Standby', 1],
  ['negotiate-household-bills', 'audit-forgotten-subscriptions', 'When the Answer Is No', 2],

  // 9 · electric bill jumped
  ['cut-electricity-bill-without-spending-money', 'why-electric-bill-jumped', '15. Monitor Your Usage', 0],
  ['keep-house-cool-summer', 'why-electric-bill-jumped', 'Priority 4: Get More From the AC', 1],
  ['dishwasher-vs-hand-washing-cost', 'why-electric-bill-jumped', '6. Cycle and Settings Choices That Matter', 2],

  // 10 · time of use
  ['save-money-on-laundry', 'time-of-use-electricity-plan', '5. Run Full Loads', 0],
  ['air-dry-vs-dryer-cost', 'time-of-use-electricity-plan', 'Making the Dryer Cheaper When You Do Use It', 1],
  ['cut-standby-power-vampire-draw', 'time-of-use-electricity-plan', '3. Rank Your Devices by What They Actually Cost', 2],
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
