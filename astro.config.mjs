// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import stripFaqSection from './src/plugins/remark-strip-faq.mjs';
import rehypeAdSlots from './src/plugins/rehype-ad-slots.mjs';
import { SITE, AD_SLOTS } from './src/utils/site-config.ts';

// ── 真实 lastmod ────────────────────────────────────────────────────
// 原先写的是 lastmod: new Date()，于是每次构建都把全部 270+ 个 URL 刷成同一个
// 构建时间戳。Google 只在确认该字段可靠时才使用它，全站时间戳同步跳动会被判为
// 噪声并最终忽略——等真的更新了重要页面，这个信号就白白浪费了。
//
// 改为读文章 frontmatter 的 updatedDate（缺失时退回 pubDate）；栏目页与首页取
// 其所辖文章里最新的那个日期，因为列表页确实只在该栏目有新增或修改时才变。
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

const ART_DIR = path.join(process.cwd(), 'src', 'content', 'articles');
/** @type {Map<string, string>} url 路径 → ISO 时间戳 */
const pageDates = new Map();
let newestDate = '';

for (const f of fs.existsSync(ART_DIR) ? fs.readdirSync(ART_DIR) : []) {
  if (!f.endsWith('.md')) continue;
  const src = fs.readFileSync(path.join(ART_DIR, f), 'utf8');
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) continue;
  const field = (k) =>
    (fm[1].match(new RegExp(`^${k}:\\s*"?([0-9]{4}-[0-9]{2}-[0-9]{2})`, 'm')) || [])[1];
  const date = field('updatedDate') || field('pubDate');
  const cat = CAT_ROUTE[(fm[1].match(/^category:\s*"?(.+?)"?\s*$/m) || [])[1]];
  const subRaw = (fm[1].match(/^subcategory:\s*"?(.+?)"?\s*$/m) || [])[1];
  if (!date || !cat || !subRaw) continue;
  const iso = new Date(`${date}T00:00:00Z`).toISOString();
  const slug = path.basename(f, '.md');
  const sub = slugify(subRaw);
  // 同一篇文章登记到它自己、子栏目、栏目、首页四级，取各自最新
  for (const p of [`/${cat}/${sub}/${slug}/`, `/${cat}/${sub}/`, `/${cat}/`, '/']) {
    const prev = pageDates.get(p);
    if (!prev || iso > prev) pageDates.set(p, iso);
  }
  if (!newestDate || iso > newestDate) newestDate = iso;
}

/** 最长前缀匹配：文章页命中自己，栏目页命中栏目，其余退回全站最新 */
function lastmodFor(url) {
  let p;
  try {
    p = new URL(url).pathname;
  } catch {
    return newestDate || new Date().toISOString();
  }
  let best = '';
  for (const key of pageDates.keys()) {
    if ((p === key || p.startsWith(key)) && key.length > best.length) best = key;
  }
  return pageDates.get(best) || newestDate || new Date().toISOString();
}

// https://astro.build/config
export default defineConfig({
  // 部署后替换为实际域名
  site: 'https://tips-for-everyday.com',

  // 生成静态 HTML（Cloudflare Pages 默认读取 dist/）
  output: 'static',

  // 统一 URL 格式：始终带尾部斜杠，避免重复内容
  trailingSlash: 'always',

  // 构建优化：内联小体积样式，减少请求数
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets',
  },

  // 图片优化
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },

  // 正文渲染前剥掉重复的 FAQ 段落（问答统一由 FaqSection 组件输出）
  // 正文渲染后在 H2 之间注入广告位（位置随文章长度自适应）
  markdown: {
    remarkPlugins: [stripFaqSection],
    rehypePlugins: [
      [rehypeAdSlots, { client: SITE.adsenseClient, slots: AD_SLOTS }],
    ],
  },

  integrations: [
    sitemap({
      // 排除不需要收录的页面（法务、工具页、错误页）
      filter: (page) =>
        !page.includes('/privacy-policy/') &&
        !page.includes('/terms/') &&
        !page.includes('/contact/') &&
        !page.includes('/editorial-policy/') &&
        !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
      // 不再用 new Date()：每个 URL 取自己的真实更新日期
      serialize: (item) => ({ ...item, lastmod: lastmodFor(item.url) }),
    }),
  ],

  compressHTML: true,
});
