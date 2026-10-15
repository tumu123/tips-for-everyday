#!/usr/bin/env node
/**
 * 迁移脚本：将 site-plan/articles/*.md 转换为 Astro content collections 格式
 * - 剥离正文中的 "Published / Last Updated" 元信息行
 * - 剥离文末的 "Suggested Structured Data" / "Meta Information for Publishing" 附录
 * - 生成 frontmatter
 */

import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = 'D:/workbuddy chengguo/2026-10-14-14-27-18/site-plan/articles';
const OUT_DIR = 'D:/workbuddy chengguo/2026-10-14-14-27-18/tips-for-everyday/src/content/articles';

// 每篇文章的元数据（从原文件正文中提取）
const meta = {
  '01-remove-hard-water-stains-shower-door.md': {
    title: 'How to Remove Hard Water Stains from Glass Shower Doors',
    description:
      "Hard water stains won't come off with glass cleaner. Here's the vinegar and baking soda method that removes mineral deposits from shower doors, step by step.",
    primaryKeyword: 'hard water stains shower door',
    secondaryKeywords: [
      'remove hard water stains from glass',
      'vinegar hard water stains',
      'clean glass shower door',
    ],
    category: 'Home Hacks',
    subcategory: 'Cleaning',
    schemaType: 'HowTo',
    howToTotalTime: 'PT45M',
    howToSupplies: [
      'White vinegar (5% acetic acid)',
      'Baking soda',
      'Dish soap',
      'Microfiber cloths',
    ],
    howToTools: ['Spray bottle', 'Squeegee', 'Plastic scraper'],
    relatedSlugs: [
      'remove-soap-scum-without-harsh-chemicals',
      'clean-grout-keep-white',
      'remove-mold-bathroom-caulk',
    ],
    featuredImageAlt:
      'White vinegar and baking soda being applied to a glass shower door with hard water stains',
    readingTime: 6,
  },
  '02-how-to-clean-washing-machine.md': {
    title: 'How to Clean a Washing Machine (Step by Step)',
    description:
      "A musty washing machine makes clean clothes smell dirty. Here's how to clean the drum, gasket, drawer, and filter — with a monthly maintenance schedule.",
    primaryKeyword: 'how to clean washing machine',
    secondaryKeywords: [
      'washing machine smells',
      'front load washer cleaning',
      'clean washer gasket',
      'washing machine maintenance',
    ],
    category: 'Home Hacks',
    subcategory: 'Appliances',
    schemaType: 'HowTo',
    howToTotalTime: 'PT2H',
    howToSupplies: ['White vinegar', 'Baking soda', 'Mild dish soap'],
    howToTools: ['Old toothbrush', 'Microfiber cloths', 'Shallow pan'],
    relatedSlugs: [
      'clean-coffee-maker-tastes-bad',
      'extend-life-of-appliances',
      'save-money-on-laundry',
    ],
    featuredImageAlt:
      'Open front-load washing machine door showing the rubber gasket being cleaned with a cloth',
    readingTime: 7,
  },
  '03-remove-pet-urine-stains-carpet.md': {
    title: 'How to Remove Pet Urine Stains and Odor from Carpet',
    description:
      "Pet urine stains come back because urate crystals survive normal cleaning. Here's the enzymatic method that removes the stain, odor, and the padding underneath.",
    primaryKeyword: 'pet urine carpet removal',
    secondaryKeywords: [
      'how to get pet urine out of carpet',
      'enzymatic cleaner urine',
      'carpet smells like urine',
      'remove dog urine odor',
    ],
    category: 'Home Hacks',
    subcategory: 'Stains',
    schemaType: 'HowTo',
    howToTotalTime: 'PT8H',
    howToSupplies: [
      'Enzymatic pet stain cleaner',
      'White vinegar',
      'Baking soda',
      'Clean white towels or microfiber cloths',
    ],
    howToTools: ['UV blacklight', 'Spray bottle', 'Plastic sheet or aluminum foil'],
    relatedSlugs: [
      'remove-coffee-stains-mugs-carpet',
      'clean-mattress-at-home',
      'remove-kitchen-odors',
    ],
    featuredImageAlt: 'Blacklight revealing hidden pet urine stains on a carpet',
    readingTime: 8,
  },
  '04-cut-electricity-bill-without-spending-money.md': {
    title: '15 Ways to Cut Your Electricity Bill Without Spending Money',
    description:
      'Lower your electric bill with 15 free changes — water heater settings, air sealing, thermostat setbacks, and more. Ranked by typical annual savings.',
    primaryKeyword: 'reduce electricity bill',
    secondaryKeywords: [
      'lower electric bill free',
      'save energy at home no cost',
      'electricity saving tips',
      'reduce power bill',
    ],
    category: 'Save Money',
    subcategory: 'Bills',
    schemaType: 'Article',
    relatedSlugs: ['lower-water-bill-checklist', 'extend-life-of-appliances', 'save-money-on-laundry'],
    featuredImageAlt: 'Home electricity meter with a hand adjusting a thermostat dial',
    readingTime: 11,
  },
  '05-remove-coffee-stains-mugs-carpet.md': {
    title: 'How to Remove Coffee Stains from Mugs and Carpet',
    description:
      "Coffee stains are tannin, not grease — so vinegar doesn't work. Here's the baking soda method for mugs and the oxygen cleaner method for carpet, step by step.",
    primaryKeyword: 'remove coffee stains',
    secondaryKeywords: [
      'remove coffee stains from mug',
      'coffee stain carpet',
      'how to get coffee out of carpet',
      'coffee stain removal ceramic',
    ],
    category: 'Home Hacks',
    subcategory: 'Stains',
    schemaType: 'HowTo',
    howToTotalTime: 'PT1H',
    howToSupplies: [
      'Baking soda',
      'White vinegar',
      'Oxygen-based cleaner',
      'Mild dish soap',
      'Clean white cloths',
    ],
    howToTools: ['Non-scratch sponge', 'Spray bottle'],
    relatedSlugs: [
      'remove-red-wine-stains',
      'remove-pet-urine-stains-carpet',
      'remove-adhesive-residue',
    ],
    featuredImageAlt:
      'White ceramic mug with brown coffee tannin stain beside baking soda and a sponge',
    readingTime: 8,
  },
};

// 从正文中提取描述行（"The fastest effective method:" 之类）作为摘要补充
function yamlEscape(str) {
  return `"${String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function buildFrontmatter(m, slug) {
  const lines = ['---'];
  lines.push(`title: ${yamlEscape(m.title)}`);
  lines.push(`description: ${yamlEscape(m.description)}`);
  lines.push(`primaryKeyword: ${yamlEscape(m.primaryKeyword)}`);
  if (m.secondaryKeywords?.length) {
    lines.push('secondaryKeywords:');
    m.secondaryKeywords.forEach((k) => lines.push(`  - ${yamlEscape(k)}`));
  }
  lines.push(`category: ${yamlEscape(m.category)}`);
  if (m.subcategory) lines.push(`subcategory: ${yamlEscape(m.subcategory)}`);
  lines.push('pubDate: 2026-10-14');
  lines.push('updatedDate: 2026-10-14');
  lines.push(`author: "Editorial Team"`);
  if (m.readingTime) lines.push(`readingTime: ${m.readingTime}`);
  lines.push(`featuredImageAlt: ${yamlEscape(m.featuredImageAlt)}`);
  lines.push(`schemaType: ${m.schemaType}`);
  if (m.howToTotalTime) lines.push(`howToTotalTime: ${yamlEscape(m.howToTotalTime)}`);
  if (m.howToSupplies?.length) {
    lines.push('howToSupplies:');
    m.howToSupplies.forEach((s) => lines.push(`  - ${yamlEscape(s)}`));
  }
  if (m.howToTools?.length) {
    lines.push('howToTools:');
    m.howToTools.forEach((s) => lines.push(`  - ${yamlEscape(s)}`));
  }
  if (m.relatedSlugs?.length) {
    lines.push('relatedSlugs:');
    m.relatedSlugs.forEach((s) => lines.push(`  - ${yamlEscape(s)}`));
  }
  lines.push('draft: false');
  lines.push('---');
  return lines.join('\n');
}

function transformBody(raw) {
  let body = raw;

  // 1. 移除 H1 标题行（标题由布局渲染，避免重复）
  body = body.replace(/^#\s+.+\n+/, '');

  // 2. 移除 "Published: ... | Last Updated: ... | Category: ..." 元信息行
  body = body.replace(/^\*\*Published:\*\*.+\n+/m, '');

  // 3. 截断到 "Suggested Structured Data" 之前的正文结束位置
  const cutMarkers = [
    /\n---\n\n### Suggested Structured Data/,
    /\n---\n\n### Meta Information for Publishing/,
  ];
  for (const marker of cutMarkers) {
    body = body.split(marker)[0];
  }

  // 4. 移除正文中重复的 Related reading 区块（由组件渲染）
  body = body.split('\n**Related reading:**')[0];

  // 5. 清理尾部多余分隔线
  body = body.replace(/\n---\s*$/, '');

  return body.trim();
}

// 执行
const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.md'));
let count = 0;

for (const file of files) {
  const m = meta[file];
  if (!m) {
    console.warn(`跳过（无元数据）：${file}`);
    continue;
  }
  const raw = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
  const body = transformBody(raw);
  const slug = file.replace(/^\d+-/, '').replace(/\.md$/, '');
  const frontmatter = buildFrontmatter(m, slug);
  const output = `${frontmatter}\n\n${body}\n`;

  fs.writeFileSync(path.join(OUT_DIR, `${slug}.md`), output, 'utf8');
  console.log(`✓ ${slug}.md  (${body.split(/\s+/).length} words body)`);
  count++;
}

console.log(`\n迁移完成：${count} 个文件`);
