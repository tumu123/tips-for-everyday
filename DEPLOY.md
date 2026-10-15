# Cloudflare Pages 部署手册

**项目：** tips-for-everyday.com
**技术栈：** Astro 5 + Cloudflare Pages（纯静态）
**成本：** $0/月（免费版：无限带宽、500 次构建/月）
**仓库：** https://github.com/tumu123/tips-for-everyday

---

## 一、配置状态（2026-10-15 更新）

### 已完成

| 项目 | 值 | 位置 |
|---|---|---|
| AdSense 发布商 ID | `ca-pub-4150144052388028` | `src/utils/site-config.ts` |
| AdSense 广告单元（横向） | `3840545729` | `AD_SLOTS.articleTop` / `AD_SLOTS.categoryTop` |
| AdSense 广告单元（方形） | `7304313863` | `AD_SLOTS.articleInline` |
| ads.txt | 真实内容，含 `pub-4150144052388028` | `public/ads.txt` |
| OG 分享图 | 1200×630 品牌图 | `public/images/og-default.jpg` |
| 内容 | 44 篇文章 / 110,195 词 | `src/content/articles/` |

### 待办（不阻塞部署）

| 项目 | 说明 |
|---|---|
| `ga4MeasurementId` | 仍为 `G-XXXXXXXXXX`。未填时 gtag 脚本不注入，不会向站点发送脏数据。上线后补填即可，仅损失补填前的流量数据 |
| `src/pages/contact.astro` 邮箱 | 当前 `contact@tips-for-everyday.com`，若该邮箱不存在请替换为实际可收信地址 |
| `social.pinterest` | 当前指向 Pinterest 首页，可改为你的实际主页（可选） |

**GA4 ID 获取：** Google Analytics → 管理 → 数据流 → 选择网站数据流 → 衡量 ID（`G-` 开头）。

---

## 二、部署到 Cloudflare Pages

### 方式 A：Git 自动部署（推荐）

**前置：** 一个 GitHub 账号。

#### A1. 推送到 GitHub —— 已完成

代码已在 https://github.com/tumu123/tips-for-everyday （分支 `main`，初始提交 `f68e697`）。

后续更新只需：

```bash
cd tips-for-everyday
git add .
git commit -m "描述本次改动"
git push
```

#### A2. 在 Cloudflare Pages 关联仓库

1. 登录 Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 授权 GitHub，选择仓库 `tumu123/tips-for-everyday`
3. 构建设置确认三项：
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. 展开 **Environment variables**，添加：
   - `NODE_VERSION` = `22`
5. 点击 **Save and Deploy**

首次构建约 1–2 分钟。完成后会得到一个 `*.pages.dev` 的临时域名。

#### A3. 绑定自定义域名

1. 进入该 Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 输入 `tips-for-everyday.com`
3. 因为域名也在 Cloudflare，会提示自动添加 DNS 记录 → 点击确认
4. 重复一次，添加 `www.tips-for-everyday.com`（会自动 301 到裸域名，规则已在 `_redirects` 中）

**SSL 自动签发**，通常几分钟内生效。

---

### 方式 B：命令行直传（无需 GitHub）

**前置：** 本机已构建成功。

```bash
cd tips-for-everyday

# 安装 Wrangler
npm install -g wrangler

# 登录（会打开浏览器授权）
wrangler login

# 首次创建项目并上传
wrangler pages project create tips-for-everyday

# 构建并部署
npm run build
wrangler pages deploy dist --project-name=tips-for-everyday
```

**缺点：** 每次更新都要手动执行构建 + 上传，没有 Git 版本历史。
**适用：** 临时预览，或不想用 GitHub 的情况。

---

## 三、部署后立即执行的 5 件事

| 顺序 | 操作 | 位置 | 目的 |
|---|---|---|---|
| 1 | 验证域名可访问 | 浏览器 | 确认 SSL 与重定向正常 |
| 2 | 提交 sitemap | Google Search Console → 站点地图 → 输入 `sitemap-index.xml` | 触发索引 |
| 3 | 验证 GA4 生效 | GA4 → 实时报告 → 自己访问站点 | 确认统计在跑 |
| 4 | 验证 AdSense 代码 | 浏览器查看源代码搜 `adsbygoogle` | 确认广告代码已输出 |
| 5 | 检查 `ads.txt` | 访问 `tips-for-everyday.com/ads.txt` | 确认 AdSense 授权文件可访问 |

### 提交 Sitemap 的具体路径

部署完成后，以下 URL 应可直接访问：

| URL | 内容 |
|---|---|
| `https://tips-for-everyday.com/sitemap-index.xml` | 站点地图索引 |
| `https://tips-for-everyday.com/robots.txt` | 爬虫规则 |
| `https://tips-for-everyday.com/ads.txt` | AdSense 授权 |
| `https://tips-for-everyday.com/rss.xml` | RSS 订阅 |

---

## 四、日常更新流程

### Git 方式（方式 A）

```bash
# 1. 新增文章：把 .md 文件放进 src/content/articles/
# 2. 本地预览
npm run dev          # 访问 http://localhost:4321

# 3. 提交推送
git add .
git commit -m "Add: how to remove rust stains from sinks"
git push
```

推送后 Cloudflare 自动构建部署，约 1–2 分钟上线。

### 新增文章的 frontmatter 模板

复制以下内容，填写后保存为 `src/content/articles/your-slug.md`：

```markdown
---
title: "How to [Action] [Object]"
description: "不少于 80 字符、不超过 200 字符的描述，包含核心关键词与价值承诺。"
primaryKeyword: "your target keyword"
secondaryKeywords:
  - "keyword variant 1"
  - "keyword variant 2"
category: "Home Hacks"
subcategory: "Cleaning"
pubDate: 2026-10-15
updatedDate: 2026-10-15
author: "Editorial Team"
readingTime: 6
featuredImageAlt: "描述图片内容"
schemaType: HowTo
howToTotalTime: "PT30M"
howToSupplies:
  - "Supply 1"
howToTools:
  - "Tool 1"
relatedSlugs:
  - "existing-article-slug"
draft: false
---

正文从这里开始（不要写 H1，标题由模板渲染）。

## What You'll Need
...

## Step-by-Step Instructions
### Step 1: ...
...

## FAQ
**问题？**
答案。

---
```

**构建时会自动校验 frontmatter。** 缺字段或格式错误会直接构建失败并报出具体行号——这是防止批量生产时元数据遗漏的机制。

### 手动方式（方式 B）

```bash
npm run build
wrangler pages deploy dist --project-name=tips-for-everyday
```

---

## 五、本地开发命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动开发服务器（http://localhost:4321，热更新） |
| `npm run build` | 构建到 `dist/` |
| `npm run preview` | 本地预览构建产物（验证生产环境效果） |

**建议习惯：** 推送前先跑 `npm run build`，确保构建通过再 push。构建失败时 Cloudflare 不会更新线上内容，但会发送失败邮件。

---

## 六、当前站点结构

```
tips-for-everyday/
├── astro.config.mjs             站点配置（含 sitemap）
├── package.json
├── tsconfig.json
├── .gitignore
│
├── public/                      静态资源（原样复制到站点根）
│   ├── robots.txt
│   ├── ads.txt                  ← 上线前必须替换
│   ├── _headers                 Cloudflare 安全与缓存头
│   ├── _redirects               www → 裸域名 301
│   ├── favicon.svg
│   └── images/                  ← 放置 og-default.jpg 与文章配图
│
├── scripts/
│   └── migrate-articles.mjs     文章迁移脚本（一次性使用）
│
└── src/
    ├── content/
    │   ├── config.ts            内容 schema（构建时校验）
    │   └── articles/            ← 文章 Markdown 放这里
    │       ├── remove-hard-water-stains-shower-door.md
    │       ├── how-to-clean-washing-machine.md
    │       ├── remove-pet-urine-stains-carpet.md
    │       ├── cut-electricity-bill-without-spending-money.md
    │       └── remove-coffee-stains-mugs-carpet.md
    │
    ├── layouts/
    │   ├── BaseLayout.astro     <head>、AdSense、GA4、页头页脚
    │   ├── ArticleLayout.astro  文章页组装
    │   └── CategoryLayout.astro 栏目页组装
    │
    ├── components/
    │   ├── Header.astro
    │   ├── Footer.astro
    │   ├── Breadcrumb.astro     面包屑 + BreadcrumbList schema
    │   ├── AdSlot.astro         广告位（未配置 ID 时显示占位）
    │   ├── FaqSection.astro     FAQ + FAQPage schema
    │   ├── RelatedPosts.astro   相关阅读
    │   └── StructuredData.astro HowTo / Article schema
    │
    ├── utils/
    │   ├── site-config.ts       ← 站点配置（AdSense/GA4 ID 在此）
    │   └── articles.ts          文章查询、FAQ 提取、内链解析
    │
    ├── styles/
    │   └── global.css           全站样式（无框架依赖）
    │
    └── pages/
        ├── index.astro          首页
        ├── about.astro
        ├── contact.astro        ← 替换邮箱
        ├── privacy-policy.astro
        ├── terms.astro
        ├── editorial-policy.astro
        ├── 404.astro
        ├── rss.xml.ts
        ├── [category]/
        │   ├── index.astro                     /home-hacks/
        │   └── [subcategory]/
        │       └── index.astro                 /home-hacks/cleaning/
        └── [...path].astro                     文章页（catch-all）
```

**路由优先级说明：** `[...path].astro` 是 catch-all 路由，优先级低于 `[category]/index.astro` 和 `[category]/[subcategory]/index.astro`，因此栏目页不会被文章路由截获。

---

## 七、内容新增后的 URL 规则

| 文章 frontmatter | 生成的 URL |
|---|---|
| `category: "Home Hacks"` + `subcategory: "Cleaning"` | `/home-hacks/cleaning/[文件名]/` |
| `category: "Save Money"` + 无 subcategory | `/save-money/[文件名]/` |

**注意：** URL 由 `category` + `subcategory` + **文件名** 共同决定。文件名要写成 SEO 友好的 kebab-case，因为它就是 URL 的最后一段。

示例：文件 `remove-rust-stains-sink.md` + `Home Hacks` / `Stains`
→ `/home-hacks/stains/remove-rust-stains-sink/`

**一旦发布，不要改文件名或 category/subcategory**——会导致 URL 变更、丢失已有排名。确实需要改时，必须在 `public/_redirects` 中添加 301 规则。

---

## 八、故障排查

| 现象 | 原因 | 解决 |
|---|---|---|
| 构建失败，提示 frontmatter 校验错误 | 文章缺必填字段 | 按报错行号补全字段 |
| 构建失败，提示 `getStaticPaths` 错误 | 栏目名与 `CATEGORIES` 不匹配 | 检查 `category` 值是否与 `site-config.ts` 中的 `title` 完全一致（含大小写） |
| 部署后页面 404 | 路径未生成 | 检查 `npm run build` 输出中是否有该路径 |
| 广告不显示 | AdSense ID 未配置或 `ads.txt` 未替换 | 检查 `site-config.ts` 与 `ads.txt` |
| 中文乱码 | 未设置编码 | 文件保存为 UTF-8 |
| 样式未生效 | 构建产物缓存 | Cloudflare 后台 Purge Cache |

---

## 九、成本与配额

| 项目 | 免费版额度 | 本站点实际消耗 |
|---|---|---|
| 带宽 | 无限 | 远低于 |
| 构建次数 | 500 次/月 | 每天更新不超过 2 次 |
| 站点数 | 100 个 | 1 个 |
| 自定义域名 | 100 个 | 1–2 个 |
| SSL | 自动 | — |
| **月成本** | — | **$0** |

---

## 十、上线检查清单

部署前逐项确认：

- [ ] `src/utils/site-config.ts` 中 `adsenseClient` 已替换为真实 ID
- [ ] `src/utils/site-config.ts` 中 `ga4MeasurementId` 已替换为真实 ID
- [ ] `public/ads.txt` 已从 AdSense 后台复制真实内容
- [ ] `src/pages/contact.astro` 中邮箱已替换
- [ ] `public/images/og-default.jpg` 已放置 1200×630 分享图
- [ ] `npm run build` 本地构建通过
- [ ] `npm run preview` 本地预览无异常
- [ ] 已推送至 Git 仓库（方式 A）
- [ ] Cloudflare Pages 项目已创建并完成首次部署
- [ ] 自定义域名已绑定，SSL 已生效
- [ ] Search Console 已提交 `sitemap-index.xml`
- [ ] 访问 `/ads.txt`、`/robots.txt`、`/sitemap-index.xml` 均正常返回
