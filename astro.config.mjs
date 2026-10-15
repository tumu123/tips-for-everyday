// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
      lastmod: new Date(),
    }),
  ],

  compressHTML: true,
});
