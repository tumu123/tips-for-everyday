import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 文章内容集合
 * 构建时会校验每篇文章的 frontmatter，缺失必填字段将直接报错。
 * 这是防止 120 篇文章批量生产时元数据遗漏的关键机制。
 */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    // ---- 必填 ----
    title: z.string().max(80),
    description: z.string().min(80).max(200),
    primaryKeyword: z.string(),
    pubDate: z.coerce.date(),
    category: z.string(),

    // ---- 选填 ----
    updatedDate: z.coerce.date().optional(),
    secondaryKeywords: z.array(z.string()).default([]),
    subcategory: z.string().optional(),
    author: z.string().default('Editorial Team'),
    readingTime: z.number().optional(),
    featuredImage: z.string().optional(),
    featuredImageAlt: z.string().optional(),
    relatedSlugs: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // 内容类型：决定使用 HowTo 还是 Article 结构化数据
    schemaType: z.enum(['HowTo', 'Article', 'ItemList']).default('Article'),
    howToTotalTime: z.string().optional(),
    howToSupplies: z.array(z.string()).default([]),
    howToTools: z.array(z.string()).default([]),
  }),
});

export const collections = { articles };
