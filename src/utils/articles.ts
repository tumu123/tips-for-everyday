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
 */
export function extractFaq(body: string): { question: string; answer: string }[] {
  const faqMatch = body.split(/^##\s+(?:FAQ|Frequently Asked Questions)\s*$/m)[1];
  if (!faqMatch) return [];

  // FAQ 段落以 "---" 或下一个 "##" 结束
  const faqBlock = faqMatch.split(/\n---\n|\n##\s/)[0];

  const items: { question: string; answer: string }[] = [];
  const re = /\*\*(.+?)\*\*\s*\n([\s\S]*?)(?=\n\*\*|\s*$)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(faqBlock)) !== null) {
    const question = m[1].trim();
    const answer = m[2].replace(/\s+/g, ' ').trim();
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
