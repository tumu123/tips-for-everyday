/**
 * 批量插入 Related Reading 区块
 *
 * 用于 HowTo 类文章：这类文章写的时候容易漏掉正文末尾的 Related Reading 区块，
 * 导致正文没有出站内链（relatedSlugs 也就无从生成）。
 *
 * 目标文章的 URL 与标题从它自己的 frontmatter 读取，避免手写 URL 出错。
 * 若某篇文章已有 Related Reading 区块，则跳过，不会重复插入。
 *
 * 用法：node scripts/add-related-reading.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const DIR = 'src/content/articles';

/** slug -> 相关 slug 列表（顺序即展示顺序） */
const MAP = {
  'unclog-slow-drain': [
    'fix-leaky-faucet',
    'unclog-toilet',
    'fix-garbage-disposal',
    'lower-water-bill-checklist',
  ],
  'fix-leaky-faucet': [
    'unclog-slow-drain',
    'fix-running-toilet',
    'lower-water-bill-checklist',
    'water-heater-maintenance',
  ],
  'unclog-toilet': [
    'fix-running-toilet',
    'unclog-slow-drain',
    'fix-garbage-disposal',
    'lower-water-bill-checklist',
  ],
  'fix-door-wont-latch': [
    'fix-sticking-door',
    'fix-squeaky-door-hinge',
    'cheap-window-insulation',
  ],
  'remove-scratches-wood-furniture': [
    'fix-hardwood-floor-scratches',
    'buy-used-furniture-safely',
  ],
  'fix-hardwood-floor-scratches': [
    'remove-scratches-wood-furniture',
    'quiet-squeaky-floors',
  ],
  'fix-window-wont-open': [
    'cheap-window-insulation',
    'fix-sticking-door',
    'save-on-heating-costs-winter',
  ],
  'recaulk-bathtub': [
    'remove-mold-bathroom-caulk',
    'remove-soap-scum',
    'remove-hard-water-stains-shower-door',
    'clean-grout-keep-white',
  ],
  'fix-wobbly-ceiling-fan': [
    'keep-house-cool-summer',
    'cut-electricity-bill-without-spending-money',
    'seasonal-home-maintenance-checklist',
  ],
  'fix-garbage-disposal': [
    'unclog-slow-drain',
    'unclog-toilet',
    'fix-leaky-faucet',
  ],

  // ---- Kitchen Tips 批次（第 9 批）----
  'avoid-freezer-burn': [
    'thaw-food-safely',
    'store-food-to-reduce-waste',
    'how-long-food-lasts-shelf-life-guide',
    'organize-fridge-less-food-waste',
  ],
  'store-coffee-beans': [
    'store-spices',
    'store-flour-pest-free',
    'store-cheese',
    'how-long-food-lasts-shelf-life-guide',
  ],
  'keep-herbs-fresh': [
    'organize-fridge-less-food-waste',
    'make-produce-last-longer',
    'store-food-to-reduce-waste',
    'store-spices',
  ],
  'store-cheese': [
    'organize-fridge-less-food-waste',
    'how-long-food-lasts-shelf-life-guide',
    'how-to-tell-if-food-is-bad',
    'keep-bread-fresh-longer',
  ],
  'clean-cast-iron-skillet': [
    'sharpen-kitchen-knives',
    'clean-cutting-board',
    'remove-burnt-food-stovetop',
    'remove-kitchen-odors',
  ],
  'store-spices': [
    'store-coffee-beans',
    'store-flour-pest-free',
    'how-long-food-lasts-shelf-life-guide',
    'organize-pantry-beginner-guide',
  ],
  'thaw-food-safely': [
    'avoid-freezer-burn',
    'how-to-tell-if-food-is-bad',
    'how-long-food-lasts-shelf-life-guide',
    'store-food-to-reduce-waste',
  ],
  'store-flour-pest-free': [
    'organize-pantry-beginner-guide',
    'store-spices',
    'store-coffee-beans',
    'how-long-food-lasts-shelf-life-guide',
  ],
  'organize-fridge-less-food-waste': [
    'store-food-to-reduce-waste',
    'make-produce-last-longer',
    'how-long-food-lasts-shelf-life-guide',
    'keep-herbs-fresh',
  ],
  'remove-kitchen-odors': [
    'clean-cast-iron-skillet',
    'clean-cutting-board',
    'fix-garbage-disposal',
    'diy-all-purpose-cleaner',
  ],

  // ---- Kitchen Tips 收尾批次（第 10 批）----
  'revive-stale-bread-chips-crackers': [
    'keep-bread-fresh-longer',
    'store-food-to-reduce-waste',
    'how-long-food-lasts-shelf-life-guide',
    'eat-well-on-small-budget',
  ],
  'store-bananas-avocados-tomatoes': [
    'make-produce-last-longer',
    'organize-fridge-less-food-waste',
    'store-food-to-reduce-waste',
    'keep-herbs-fresh',
  ],
  'store-leftover-wine': [
    'how-to-tell-if-food-is-bad',
    'how-long-food-lasts-shelf-life-guide',
    'organize-small-kitchen',
    'save-money-on-groceries',
  ],
  'clean-coffee-maker-tastes-bad': [
    'descale-kettle-coffee-maker',
    'store-coffee-beans',
    'clean-stainless-steel-appliances',
    'remove-hard-water-stains-shower-door',
  ],
};

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const meta = new Map();

/**
 * 读取 frontmatter。
 * 注意：本项目文件为 CRLF 换行，正则必须写 \r?\n，否则整体匹配失败。
 */
function readFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return {};
  const fm = {};
  for (const key of ['title', 'category', 'subcategory']) {
    const km = m[1].match(
      new RegExp(`^${key}:\\s*"?([^"\\r\\n]+)"?\\s*\\r?$`, 'm')
    );
    if (km) fm[key] = km[1].trim();
  }
  return fm;
}

function slugify(s) {
  return String(s).toLowerCase().replace(/\s+/g, '-');
}

const CAT_SLUGS = {
  'Home Hacks': 'home-hacks',
  'Save Money': 'save-money',
  Organize: 'organize',
  'Kitchen Tips': 'kitchen-tips',
  'Fix It': 'fix-it',
};

// 1. 建立 slug -> {title, url}
for (const f of files) {
  const slug = path.basename(f, '.md');
  const src = fs.readFileSync(path.join(DIR, f), 'utf8');
  const fm = readFrontmatter(src);
  if (!fm.category) continue;
  const cat = CAT_SLUGS[fm.category] ?? slugify(fm.category);
  const sub = fm.subcategory ? slugify(fm.subcategory) : null;
  meta.set(slug, {
    title: fm.title ?? slug,
    url: sub ? `/${cat}/${sub}/${slug}/` : `/${cat}/${slug}/`,
  });
}

// 2. 插入
let done = 0;
for (const [slug, targets] of Object.entries(MAP)) {
  const p = path.join(DIR, `${slug}.md`);
  if (!fs.existsSync(p)) {
    console.log(`  ! 找不到 ${slug}.md`);
    continue;
  }
  let src = fs.readFileSync(p, 'utf8');

  if (/^## Related Reading\s*$/m.test(src)) {
    console.log(`  - ${slug}: 已有区块，跳过`);
    continue;
  }

  const lines = targets
    .map((t) => {
      const m = meta.get(t);
      if (!m) {
        console.log(`  ! ${slug}: 目标不存在 ${t}`);
        return null;
      }
      return `- [${m.title}](${m.url})`;
    })
    .filter(Boolean);

  if (lines.length === 0) continue;

  const nl = src.includes('\r\n') ? '\r\n' : '\n';
  const block = `## Related Reading${nl}${nl}${lines.join(nl)}${nl}${nl}---${nl}${nl}`;

  // 插到 FAQ 之前
  const faqRe = /^## Frequently Asked Questions\s*$/m;
  if (!faqRe.test(src)) {
    console.log(`  ! ${slug}: 找不到 FAQ 标题，无法定位插入点`);
    continue;
  }
  src = src.replace(faqRe, `${block}## Frequently Asked Questions`);

  if (!DRY) fs.writeFileSync(p, src, 'utf8');
  console.log(`  + ${slug}: ${lines.length} 条`);
  done++;
}

console.log(DRY ? '\n[DRY RUN] 未写入' : `\n已插入 ${done} 个区块`);
