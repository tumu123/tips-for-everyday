/**
 * 站点全局配置
 * 上线前需要替换的值集中在此文件，避免散落在各处。
 */
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
    subcategories: ['Cleaning', 'Laundry', 'Appliances', 'Stains'],
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
    subcategories: ['Food Storage', 'Cooking Hacks'],
  },
  'fix-it': {
    title: 'Fix It',
    description:
      'Fix common household problems yourself — plumbing, doors, walls, and small repairs — without calling a professional for jobs that take minutes.',
    subcategories: ['Home Repair', 'Maintenance', 'Plumbing', 'Appliances'],
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
  // Fix It
  'Home Repair':
    'Fix sticking doors, squeaky hinges and floors, and drywall holes yourself — with the diagnosis-first approach that avoids unnecessary damage.',
  Maintenance:
    'Seasonal and annual maintenance that prevents expensive repairs — home checklists, frozen pipe prevention, and water heater care.',
  Plumbing:
    'Diagnose and fix common plumbing problems yourself — running toilets, leaks, and clogs — without a service call.',
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
 * 文章首图路径。
 * 按「子栏目」配图（18 张统一风格插画，scripts/process-heroes.mjs 生成），
 * 同一子栏目的文章共用一张，alt 与 og:image 文案逐篇独立。
 * 万一某篇文章没有子栏目，回落到 cleaning（图片必然存在）。
 */
export function heroImage(subcategory?: string): string {
  if (!subcategory) return '/images/heroes/cleaning.webp';
  return `/images/heroes/${subcategoryToSlug(subcategory)}.webp`;
}
