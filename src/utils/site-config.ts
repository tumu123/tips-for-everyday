/**
 * 站点全局配置
 * 上线前需要替换的值集中在此文件，避免散落在各处。
 *
 * 注意：本文件会被 .astro 的 frontmatter 引用（构建时执行，非浏览器端），
 * 因此可以使用 node:fs 读取 public/ 下的图片清单。
 */
import fs from 'node:fs';
import path from 'node:path';

export const SITE = {
  domain: 'tips-for-everyday.com',
  url: 'https://tips-for-everyday.com',
  title: 'Tips for Everyday',
  tagline: 'Practical answers to everyday problems at home.',
  description:
    'Practical, step-by-step answers to everyday household problems — cleaning, organizing, fixing, and saving money. No fluff, just methods that work.',

  // ---- 上线前替换 ----
  adsenseClient: 'ca-pub-4150144052388028', // AdSense 发布商 ID（已填）
  ga4MeasurementId: 'G-80WH4KR7T4', // GA4 衡量 ID（含 XXXX 时脚本不注入）
  // --------------------
  // 账号级 ID 已就绪。以下广告单元 ID 需在 AdSense 后台
  // 「广告 → 按广告单元 → 展示广告」创建后回填；全部留空则广告位不渲染。
  // --------------------

  author: {
    name: 'Editorial Team',
    bio: 'We test household cleaning, organizing, and money-saving methods and document what actually works — including what does not.',
  },

  social: {
    pinterest: 'https://www.pinterest.com/',
  },

  // 主导航栏目（顺序即导航顺序）
  nav: [
    { label: 'Home Hacks', slug: 'home-hacks' },
    { label: 'Save Money', slug: 'save-money' },
    { label: 'Organize', slug: 'organize' },
    { label: 'Kitchen Tips', slug: 'kitchen-tips' },
    { label: 'Fix It', slug: 'fix-it' },
    { label: 'Pest Control', slug: 'pest-control' },
    { label: 'Seasonal', slug: 'seasonal' },
  ],
};

/**
 * AdSense 广告单元 ID
 * 在 AdSense 后台创建广告单元后，把 ID 填到这里即可全站生效。
 * 留空字符串 → 该广告位不渲染（不会报错，也不会留空白）。
 *
 * 注意：一页之内的每个位置都必须用**不同的**单元 ID。
 * 曾用同一个单元覆盖正文 4 个位置，实测被 AdSense 去重：
 * 同页 4 个位里 2 个始终拿不到 data-ad-status，等于白放。
 *
 * 单元类型与后台设置见 memory/2026-10-22.md。
 */
export const AD_SLOTS = {
  /** ① 引言后、第 1 个 H2 之前 · 展示广告（响应式） */
  articleTop: '7304313863',
  /** ② 全文约 35% 处（H2 ≥ 6）· 文章内嵌广告 in-article */
  articleMid: '5340933845',
  /** ③ 全文约 75% 处（H2 ≥ 10）· 展示广告（响应式） */
  articleLate: '8756600526',
  /** ④ 正文结尾、FAQ 之前 · 展示广告（响应式） */
  articleEnd: '7775525494',
  /** ⑤ 侧栏 sticky（≥1280px）· 展示广告（固定 300×600） */
  articleRail: '9606025645',
  /** ⑥ 列表页卡片流 · 信息流广告 in-feed */
  listFeed: '1400232563',
  /** 列表页顶部横幅（首页与栏目页共用）· 展示广告（响应式） */
  categoryTop: '3840545729',
};

/**
 * 信息流单元（⑥）的 layout key。
 * 由 AdSense 后台按样式配置编码生成，决定列数、图片位置与间距。
 * 必须原样使用：改动或省略会让单元退化成普通响应式，不再贴合卡片。
 */
export const AD_LAYOUT_KEYS = {
  listFeed: '-gw-3+1f-3d+2z',
};

/** ⑤ 侧栏固定尺寸单元的宽高（与 .article-shell 的 300px 列宽一致） */
export const AD_RAIL_SIZE = { width: 300, height: 600 };

/**
 * 栏目定义：slug → 显示名、描述、子栏目
 * 用于生成栏目页与面包屑。
 */
export const CATEGORIES = {
  'home-hacks': {
    title: 'Home Hacks',
    description:
      'Cleaning methods, stain removal, and appliance care that actually work. Every guide includes specific ratios, dwell times, and the mistakes to avoid.',
    subcategories: ['Cleaning', 'Laundry', 'Fabrics', 'Appliances', 'Stains'],
  },
  'save-money': {
    title: 'Save Money',
    description:
      'No-cost and low-cost ways to cut household bills — electricity, water, groceries, and home maintenance. Ranked by typical annual savings.',
    subcategories: ['Groceries', 'Bills', 'Big Decisions', 'Shopping'],
  },
  organize: {
    title: 'Organize',
    description:
      'Practical home organization systems for kitchens, closets, small spaces, and paperwork — designed to stay organized long term.',
    subcategories: ['Kitchen', 'Closet', 'Small Spaces', 'Laundry', 'Home Systems'],
  },
  'kitchen-tips': {
    title: 'Kitchen Tips',
    description:
      'Food storage, preservation, and kitchen care guides. How long things actually last, how to store them properly, and how to tell when food has gone bad.',
    subcategories: ['Food Storage', 'Cooking Hacks', 'Equipment'],
  },
  'fix-it': {
    title: 'Fix It',
    description:
      'Fix common household problems yourself — plumbing, doors, walls, and small repairs — without calling a professional for jobs that take minutes.',
    subcategories: ['Home Repair', 'Maintenance', 'Plumbing', 'Appliances'],
  },
  'pest-control': {
    title: 'Pest Control',
    description:
      'Identify what is living in your house and stop it without a fogger or a service contract. Species first, then the source, then the method — including when to call someone.',
    subcategories: ['Insects', 'Rodents'],
  },
  seasonal: {
    title: 'Seasonal & Holiday',
    description:
      'Season-by-season home checklists, prep timelines, and holiday guides — what to do now so the next season does not catch you unprepared.',
    subcategories: ['Seasons', 'Holidays'],
  },
};

/**
 * 子栏目专属描述
 * 用于子栏目页的 meta description 与页头文案。
 * 若某子栏目未在此定义，则回退到所属栏目的描述。
 * 这避免了同一栏目下多个子栏目页输出完全相同的 description。
 */
export const SUBCATEGORY_DESCRIPTIONS: Record<string, string> = {
  // 栏目级覆盖（同名子栏目分属不同栏目时使用）
  'organize/Laundry':
    'A laundry room or laundry closet organized around the work flow — sorting, washing, drying, and folding each with a place, so nothing doubles back.',
  'fix-it/Appliances':
    'Diagnose machines that stopped working — water heaters, washers, dryers, fridges, and dishwashers — symptom first, so you know what it is before you pay anyone.',
  // Home Hacks
  Cleaning:
    'Deep-clean guides for floors, grout, mattresses, and hard surfaces — with the specific ratios, dwell times, and order of operations that get results.',
  Laundry:
    'Laundry that works: a laundry room laid out so the work flows, plus care guides for stains, odors, delicates, and the machines themselves.',
  Fabrics:
    'Curtains, carpets, pillows, and duvets — the soft furnishings that hold dust and odor but never go in a normal wash cycle, with the fabric test that decides the method.',
  Appliances:
    'Keep appliances clean and running longer — washing machines, range hoods, kettles, and stainless steel — with maintenance that prevents expensive failures.',
  Stains:
    'Stain removal for grease, rust, mold, adhesive, wine, coffee, and pet accidents — matched to the surface and the chemistry of each stain.',
  // Save Money
  Groceries:
    'Spend less on food without coupons: smarter shopping, food storage that prevents waste, and buying decisions that cut the monthly grocery bill.',
  Bills:
    'Cut electricity, water, and laundry costs with no-cost and low-cost changes — each one explained with what it actually saves.',
  'Big Decisions':
    'The purchases and claims that run into thousands: solar, heating systems, insurance claims, and property tax appeals — with the payback math and the questions that actually decide it.',
  Shopping:
    'Buy better and replace less often: how to judge when an appliance is worth repairing, and how to extend the life of what you already own.',
  // Organize
  Kitchen:
    'Kitchen organization systems for small spaces and no-pantry kitchens — zone layouts, storage that fits, and habits that keep it working.',
  Closet:
    'Closet, wardrobe, and paper organization that holds up over time — zoning by frequency, seasonal storage, and document retention rules.',
  'Small Spaces':
    'Make tight spaces functional — under-sink cabinets, small kitchens, and storage that uses vertical space instead of buying more bins.',
  'Home Systems':
    'Organize the recurring systems of a home — cleaning supplies, household stock, and the routines that keep them from drifting back into clutter.',
  // Kitchen Tips
  'Food Storage':
    'How long food actually lasts, how to store it so it keeps, and how to tell when it has genuinely gone bad — with real shelf-life windows.',
  'Cooking Hacks':
    'Kitchen techniques worth knowing: keeping produce fresh, sharpening knives, and cleaning and caring for the tools you cook with.',
  Equipment:
    'What each kitchen machine actually does, which pans suit which job, and which gadgets earn their drawer space — buying decisions and safe-use limits rather than feature lists.',
  // Fix It
  'Home Repair':
    'Fix sticking doors, squeaky hinges and floors, and drywall holes yourself — with the diagnosis-first approach that avoids unnecessary damage.',
  Maintenance:
    'Seasonal and annual maintenance that prevents expensive repairs — home checklists, frozen pipe prevention, and water heater care.',
  Plumbing:
    'Diagnose and fix common plumbing problems yourself — running toilets, leaks, and clogs — without a service call.',
  // Pest Control
  Insects:
    'Identify the bug before you treat it — fruit flies, ants, silverfish, spiders, and pantry moths — with the breeding site that keeps them coming back.',
  Rodents:
    'Find out whether mice or rats are inside, where they are getting in, and how to close the building against them before winter.',
  // Seasonal & Holiday
  Seasons:
    'Season-by-season home checklists — spring cleaning, storm prep, fall maintenance, and winterizing — sequenced in the order the work actually needs doing.',
  Holidays:
    'Holiday prep without the panic: hosting timelines, guest rooms on short notice, decoration storage, and getting back to routine afterward.',
};

/** 子栏目 → 所属主栏目 的反查映射 */
export const SUBCATEGORY_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORIES).flatMap(([slug, cat]) =>
    cat.subcategories.map((sub) => [sub, slug])
  )
);

/** 生成文章 URL：/home-hacks/cleaning/remove-hard-water-stains-shower-door/ */
export function articleUrl(slug, category, subcategory) {
  const catSlug = categorySlug(category);
  const subSlug = subcategory ? subcategoryToSlug(subcategory) : null;
  return subSlug ? `/${catSlug}/${subSlug}/${slug}/` : `/${catSlug}/${slug}/`;
}

/** 栏目中文显示名 → URL slug */
export function categorySlug(categoryName) {
  const found = Object.entries(CATEGORIES).find(([, c]) => c.title === categoryName);
  return found ? found[0] : 'home-hacks';
}

/** 子栏目显示名 → URL slug */
export function subcategoryToSlug(subName) {
  return String(subName).toLowerCase().replace(/\s+/g, '-');
}

/**
 * 子栏目首图的实际内容描述。
 *
 * 这张表存在的唯一理由：alt 必须描述「图里到底画了什么」，
 * 而不是「这篇文章讲什么」。子栏目图是通用插画，
 * 同一子栏目下的文章共用一张，所以 alt 也只能到子栏目粒度。
 * 真正描述文章主题的文案属于 featuredImageAlt，仅在文章有独立首图时使用。
 *
 * 改动任何一张图，必须同步改这里对应的文案，否则又是一次「alt 说谎」。
 */
export const HERO_ALT: Record<string, string> = {
  appliances:
    'Flat illustration of a stovetop kettle with a small lightning bolt, a toaster, stacked bowls, and a dark green oven',
  'big-decisions':
    'Flat illustration of a small wooden house model, a clipboard with a checklist and pen, papers under a magnifying glass, and a potted snake plant',
  bills:
    'Flat illustration of a calculator printing a receipt, two envelopes, a steaming mug, a desk lamp, and a potted snake plant',
  cleaning:
    'Flat illustration of a kitchen sink with a faucet, a potted plant, a folded cloth, and a glass spray bottle surrounded by sparkles',
  closet:
    'Flat illustration of an open wardrobe with folded clothes on shelves, three garments on hangers, a pair of brown shoes, and a plant on top',
  'cooking-hacks':
    'Flat illustration of a wooden cutting board with a chef knife, a bundle of herbs, chives, halved lemons, and a small bowl of dark olives',
  equipment:
    'Flat illustration of an air fryer, a lidded pot with a wooden spoon, a kitchen scale, and a folded cloth',
  fabrics:
    'Flat illustration of an orange cushion, a rolled blanket, a stack of folded towels, and a striped curtain panel',
  'food-storage':
    'Flat illustration of an open green refrigerator filled with lidded containers of produce, with a cutting board, a bowl of fruit, and a jug beside it',
  groceries:
    'Flat illustration of a brown paper grocery bag filled with carrots, leafy greens, a tomato, and leeks on a wooden counter',
  holidays:
    'Flat illustration of a string of glowing bulbs, a green wreath with a bow, two wrapped gifts, a small potted tree, and a patterned rug',
  'home-repair':
    'Flat illustration of an open toolbox holding a hammer, a screwdriver, and a wrench, with a roll of tape and two screws beside it',
  'home-systems':
    'Flat illustration of a wall board with five hanging keys, two storage bins on a bench, a potted plant, a key-shaped mat, and a framed key board',
  insects:
    'Flat illustration of a line of black ants walking toward a glass jar of amber honey and a white bowl',
  kitchen:
    'Flat illustration of two white shelves holding glass jars of pasta, grains and beans, a jar of white grains with an orange scoop, and a wire basket of pineapple and bananas',
  laundry:
    'Flat illustration of a green washer with its door open, a woven basket of folded orange towels, and a clothesline with a tie and cloth above',
  maintenance:
    'Flat illustration of a pale green house with a ladder leaning to the roof, a pile of autumn leaves, a rake, and a bare tree',
  plumbing:
    'Flat illustration of a bathroom vanity with its door open, showing the P-trap under the sink, a bucket, plumber tape, and a pipe wrench',
  rodents:
    'Flat illustration of a grey house mouse beside a coil of steel wool on a wooden floor in front of a white baseboard',
  seasons:
    'Flat illustration of a white house with a pile of autumn leaves by the steps, a watering can, and a rake leaning on the wall',
  shopping:
    'Flat illustration of two kraft boxes with a hanging price tag, a tan tote bag, three coins, and a small plant',
  'small-spaces':
    'Flat illustration of a narrow wall with a tall cabinet, a hanging tote, three stacked drawer boxes, a folding table with a plant, and a round stool',
  stains:
    'Flat illustration of a white shirt with a brown stain, a scrubbing brush, and a bottle of cleaner',
};

/** 构建时读一次 public/images/heroes 下的文件名（不含扩展名），之后走缓存 */
let heroFileCache: Set<string> | null = null;
function heroFiles(): Set<string> {
  if (heroFileCache) return heroFileCache;
  try {
    heroFileCache = new Set(
      fs
        .readdirSync(path.join(process.cwd(), 'public/images/heroes'))
        .filter((f) => f.endsWith('.webp'))
        .map((f) => f.replace(/\.webp$/, ''))
    );
  } catch {
    heroFileCache = new Set();
  }
  return heroFileCache;
}

/**
 * 这篇文章是否配了独立首图（public/images/heroes/<slug>.webp）。
 * 有独立图时，featuredImageAlt 才会被真正使用。
 */
export function hasOwnHero(slug?: string): boolean {
  return Boolean(slug && heroFiles().has(slug));
}

/**
 * 文章首图路径：slug 优先，子栏目回退。
 *
 * 逐篇出图的那天，只要把 <slug>.webp 放进 public/images/heroes/，
 * 这一篇就自动切过去，不用改任何代码。
 * 两者都没有时回落到 cleaning（该文件必然存在，预检 17 不会挂）。
 */
export function heroImage(slug?: string, subcategory?: string): string {
  const files = heroFiles();
  if (slug && files.has(slug)) return `/images/heroes/${slug}.webp`;
  if (subcategory) {
    const sub = subcategoryToSlug(subcategory);
    if (files.has(sub)) return `/images/heroes/${sub}.webp`;
  }
  return '/images/heroes/cleaning.webp';
}

/** 子栏目首图的 alt。文案如实描述画面，与文章主题无关。 */
export function heroAlt(subcategory?: string): string {
  const sub = subcategory ? subcategoryToSlug(subcategory) : '';
  return (
    HERO_ALT[sub] ??
    'Flat illustration of household supplies and tools on a warm beige background'
  );
}
