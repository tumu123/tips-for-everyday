/**
 * 一次性处理 _gen/ 下的 AI 原图 → public/images/heroes/*.webp
 *
 * 统一处理：
 *   1. 裁掉底部 88px（生成器把 "AI生成" 水印烙在右下角，裁掉最稳妥）
 *   2. 缩放到 1200 宽（正文栏最宽 760 + 2x 密度余量）
 *   3. WebP q82 —— 目标单张 < 100KB
 *   4. 另出一张 1200x630 的 og-default.jpg（社交分享卡）
 *
 * 用法：node scripts/process-heroes.mjs   （从 _gen 重新生成）
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = '_gen';
const OUT = 'public/images/heroes';
fs.mkdirSync(OUT, { recursive: true });

// 裁掉底部水印区：1536x1024 → 1536x936（去 88px）
const CROP_H = 936;

const files = fs
  .readdirSync(SRC)
  .filter((f) => f.endsWith('.png') && !f.startsWith('og-'));

let total = 0;
for (const f of files) {
  const slug = f.replace(/\.png$/, '');
  const out = path.join(OUT, `${slug}.webp`);
  const buf = await sharp(path.join(SRC, f))
    .extract({ left: 0, top: 0, width: 1536, height: CROP_H })
    .resize({ width: 1200 })
    .webp({ quality: 82 })
    .toBuffer();
  fs.writeFileSync(out, buf);
  const kb = (buf.length / 1024).toFixed(0);
  total += buf.length;
  console.log(`${slug}.webp  ${kb} KB`);
}

// 社交分享默认图（1200x630，从 cleaning 裁中部）
const og = await sharp(path.join(SRC, 'cleaning.png'))
  .extract({ left: 0, top: 122, width: 1536, height: 800 })
  .resize({ width: 1200, height: 630, fit: 'cover' })
  .jpeg({ quality: 82 })
  .toBuffer();
fs.mkdirSync('public/images', { recursive: true });
fs.writeFileSync('public/images/og-default.jpg', og);
console.log(`og-default.jpg  ${(og.length / 1024).toFixed(0)} KB`);

console.log(`合计 ${(total / 1024 / 1024).toFixed(2)} MB / ${files.length} 张`);
