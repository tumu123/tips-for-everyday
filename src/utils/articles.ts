/**
 * 文章查询与处理工具
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, categorySlug, subcategoryToSlug } from './site-config';

export type Article = CollectionEntry<'articles'>;

/** 获取所有已发布文章，按日期倒序 */
export async function getAllArticles(): Promise<Article[]> {
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  return articles.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** 生成文章 URL */
export function getArticleUrl(article: Article): string {
  const { category, subcategory } = article.data;
  const catSlug = categorySlug(category);
  const subSlug = subcategory ? subcategoryToSlug(subcategory) : null;
  return subSlug
    ? `/${catSlug}/${subSlug}/${article.id}/`
    : `/${catSlug}/${article.id}/`;
}

/** 按主栏目筛选文章 */
export function filterByCategory(articles: Article[], catSlug: string): Article[] {
  const cat = CATEGORIES[catSlug as keyof typeof CATEGORIES];
  if (!cat) return [];
  return articles.filter((a) => a.data.category === cat.title);
}

/** 按子栏目筛选文章 */
export function filterBySubcategory(
  articles: Article[],
  catSlug: string,
  subSlug: string
): Article[] {
  const cat = CATEGORIES[catSlug as keyof typeof CATEGORIES];
  if (!cat) return [];
  return articles.filter(
    (a) =>
      a.data.category === cat.title &&
      a.data.subcategory &&
      subcategoryToSlug(a.data.subcategory) === subSlug
  );
}

/**
 * 从 Markdown 正文中提取 FAQ
 * 识别 "## FAQ" 或 "## Frequently Asked Questions" 之后的 "**Question?**" 段落
 *
 * 注意（踩过的坑）：源 md 是 CRLF，所有行级分隔必须是 `\r?\n`。
 * 早期这里写成 `split(/\n---\n/)`，对 `\r\n---\r\n` 匹配失败，
 * FAQ 块会一路吃到文件末尾，把正文尾部的 JSON-LD 代码块、
 * Meta information 清单全吞进最后一条答案。
 * 三道防线：统一行尾 → 多分隔符截断 → 单条答案长度兜底。
 */
const FAQ_MAX_ANSWER = 700;

export function extractFaq(body: string): { question: string; answer: string }[] {
  // 统一行尾，后续正则只需处理 \n
  const normalized = (body ?? '').replace(/\r\n?/g, '\n');

  const faqMatch = normalized.split(/^##\s+(?:FAQ|Frequently Asked Questions)\s*$/m)[1];
  if (!faqMatch) return [];

  // FAQ 段落以分隔线、下一个二级标题或任意三级标题结束
  const faqBlock = faqMatch.split(/\n-{3,}\s*\n|\n#{2,3}\s/)[0];

  const items: { question: string; answer: string }[] = [];
  const re = /\*\*(.+?)\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(faqBlock)) !== null) {
    const question = m[1].trim();
    let answer = m[2].replace(/\s+/g, ' ').trim();

    // 兜底：答案不该出现代码块或结构化数据，出现即视为解析越界，截断
    const leak = answer.search(/```|@context|###\s|Meta information/);
    if (leak >= 0) answer = answer.slice(0, leak).trim();

    // 兜底：单条答案超长说明又吞进了后续内容，截到句末
    if (answer.length > FAQ_MAX_ANSWER) {
      const cut = answer.lastIndexOf('. ', FAQ_MAX_ANSWER);
      answer = cut > 0 ? answer.slice(0, cut + 1) : answer.slice(0, FAQ_MAX_ANSWER);
    }

    if (question && answer && question.endsWith('?')) {
      items.push({ question, answer });
    }
  }
  return items;
}

/** 提取 Markdown 中的所有标题（用于生成目录与 HowTo 步骤） */
export function extractHeadings(body: string) {
  const headings: { depth: number; slug: string; text: string }[] = [];
  const re = /^(#{2,4})\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const depth = m[1].length;
    const text = m[2].trim();
    const slug = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    headings.push({ depth, slug, text });
  }
  return headings;
}

/**
 * 提取 HowTo 步骤：标题 + 该标题下的首段正文。
 *
 * 原先 HowToStep.text 直接等于 name（标题），等于让 Google 收到
 * 「Step 1: Identify the Species」这样一句没有任何指令内容的文本，
 * 结构化数据形同虚设。这里取标题下的第一段正文，压平 Markdown 后
 * 截到句末，作为真正的步骤说明。
 *
 * 序数为 0 的标题（Step 0）按设计排除，属前置判断而非执行步骤。
 */
export function extractHowToSteps(
  body: string
): { name: string; text: string; slug: string }[] {
  const STEP_RE = /^(?:Step|Part|Method)\s+[1-9]\d*\b/i;

  // 压平行内 Markdown，保留可读文本
  const flatten = (raw: string) =>
    raw
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^\s{0,3}>\s?/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/[*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  // 截到句末（不超过 320 字符），退化为词边界
  const clip = (text: string, max = 320) => {
    if (text.length <= max) return text;
    const window = text.slice(0, max);
    const lastStop = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '));
    if (lastStop >= max * 0.5) return window.slice(0, lastStop + 1).trim();
    const spaceAt = window.lastIndexOf(' ');
    return `${(spaceAt > 0 ? window.slice(0, spaceAt) : window).replace(/[,;:—–-]$/, '')}.`;
  };

  const steps: { name: string; text: string; slug: string }[] = [];
  let open: { name: string; slug: string; depth: number; buf: string[] } | null = null;

  const commit = () => {
    if (!open) return;
    const text = clip(flatten(open.buf.join('\n')));
    steps.push({
      name: open.name,
      // 正文为空时退回标题，至少不让字段缺失
      text: text || open.name,
      slug: open.slug,
    });
    open = null;
  };

  const begin = (name: string, depth: number) => {
    open = {
      name,
      depth,
      slug: name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-'),
      buf: [],
    };
  };

  for (const line of body.split(/\r?\n/)) {
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      const depth = heading[1].length;
      const name = heading[2].trim();
      const isStep = STEP_RE.test(name);

      if (!open) {
        if (isStep) begin(name, depth);
      } else if (isStep || depth <= open.depth) {
        // 新步骤，或遇到同级及更高层级的标题 → 收束当前步骤
        commit();
        if (isStep) begin(name, depth);
      }
      // 其余情况是当前步骤内部的子标题：保持收集状态，
      // 但要丢掉标题行本身，只取它下面的正文
      continue;
    }
    if (open) open.buf.push(line);
  }
  commit();

  return steps;
}

/** 解析相关文章（按 relatedSlugs 匹配，不足时用同栏目文章补齐） */
export function resolveRelated(
  current: Article,
  all: Article[],
  limit = 3
): { slug: string; title: string; description: string; url: string }[] {
  const bySlug = new Map(all.map((a) => [a.id, a]));
  const picked: Article[] = [];

  for (const slug of current.data.relatedSlugs) {
    const found = bySlug.get(slug);
    if (found && found.id !== current.id && !picked.includes(found)) {
      picked.push(found);
    }
    if (picked.length >= limit) break;
  }

  // 不足则用同主栏目文章补齐
  if (picked.length < limit) {
    const sameCat = all.filter(
      (a) => a.data.category === current.data.category && a.id !== current.id
    );
    for (const a of sameCat) {
      if (picked.length >= limit) break;
      if (!picked.includes(a)) picked.push(a);
    }
  }

  // 仍不足则跨栏目补齐
  if (picked.length < limit) {
    for (const a of all) {
      if (picked.length >= limit) break;
      if (a.id !== current.id && !picked.includes(a)) picked.push(a);
    }
  }

  return picked.map((a) => ({
    slug: a.id,
    title: a.data.title,
    description: a.data.description,
    url: getArticleUrl(a),
  }));
}

/** 去除 Markdown 与 frontmatter，得到纯文本（用于摘要） */
export function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
