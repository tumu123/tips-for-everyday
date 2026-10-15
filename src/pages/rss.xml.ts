import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllArticles, getArticleUrl } from '../utils/articles';
import { SITE } from '../utils/site-config';

export async function GET(context: APIContext) {
  const articles = await getAllArticles();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.pubDate,
      link: getArticleUrl(article),
      categories: [
        article.data.category,
        ...(article.data.subcategory ? [article.data.subcategory] : []),
      ],
    })),
    customData: '<language>en-us</language>',
  });
}
