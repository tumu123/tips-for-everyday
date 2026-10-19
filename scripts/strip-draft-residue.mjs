#!/usr/bin/env node
/**
 * 清理正文尾部的工作稿残留。
 *
 * 历史问题：早期批量生成的文章把「Structured data」JSON-LD 代码块与
 * 「Meta information」清单直接写进了正文 markdown，被 Astro 当普通段落渲染，
 * 读者能看到满屏代码；同时 extractFaq 的截断正则失效（CRLF），把这堆东西
 * 吞进了最后一条 FAQ 答案，连 FAQPage 结构化数据一起污染。
 *
 * 本脚本只做一件事：在 `### Structured data` / `### Meta information`
 * 这两个标题处截断，连同其前面的空行、`---` 分隔线一起删除，保留答案正文。
 *
 * 用法：
 *   node scripts/strip-draft-residue.mjs --dry    # 只报告，不写盘
 *   node scripts/strip-draft-residue.mjs          # 实际清理
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ARTICLES = 'src/content/articles';
const DRY = process.argv.includes('--dry');

/** 残留段落起始标题（任一命中即从该行截断） */
const RESIDUE_RE = /^###\s+(?:Structured data|Meta information)\s*$/m;

/** 从命中位置向前吃掉空行与 --- 分隔线 */
function trimHead(text, index) {
  let end = index;
  // 先退到行首
  const lineStart = text.lastIndexOf('\n', end - 1) + 1;
  end = lineStart;
  // 向前吞掉空行和 --- 分隔线
  for (;;) {
    const prevStart = text.lastIndexOf('\n', end - 2) + 1;
    const prevLine = text.slice(prevStart, end).replace(/\r?\n$/, '').trim();
    if (prevLine === '' || /^-{3,}$/.test(prevLine)) {
      end = prevStart;
      if (prevStart === 0) break;
      continue;
    }
    break;
  }
  return end;
}

const files = readdirSync(ARTICLES).filter((f) => f.endsWith('.md'));
const hit = [];

for (const file of files) {
  const path = join(ARTICLES, file);
  const raw = readFileSync(path, 'utf8');
  const m = raw.match(RESIDUE_RE);
  if (!m) continue;

  const cut = trimHead(raw, m.index);
  const removed = raw.length - cut;
  // 确保截断点在最后一条 FAQ 答案之后，不会把正文内容一起砍掉
  const kept = raw.slice(0, cut).replace(/[ \t]+$/, '');
  // 保持原文件的换行风格，避免混出 CRLF/LF 混合行尾
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const cleaned = kept.replace(/(?:\r?\n)+$/, '') + eol;

  hit.push({ file, removed, cutLine: raw.slice(0, cut).split('\n').length });
  if (!DRY) writeFileSync(path, cleaned, 'utf8');
}

console.log(`扫描 ${files.length} 篇，命中残留 ${hit.length} 篇${DRY ? '（dry run，未写盘）' : ''}`);
for (const h of hit) {
  console.log(`  ${h.file}  删除 ${h.removed} 字节（保留至第 ${h.cutLine} 行）`);
}
