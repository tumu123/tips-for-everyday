import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

// 用法：node scripts/hero-one.mjs <源图> <slug> [slug2=源图2 ...]
// 单张：node scripts/hero-one.mjs _gen/a.png my-slug
const args = process.argv.slice(2);

async function convert(src, slug) {
  const meta = await sharp(src).metadata();
  const out = path.join('public/images/heroes', `${slug}.webp`);
  const buf = await sharp(src)
    .extract({ left: 0, top: 0, width: meta.width, height: Math.min(942, meta.height) })
    .resize({ width: 1200 })
    .webp({ quality: 82 })
    .toBuffer();
  fs.writeFileSync(out, buf);
  const m = await sharp(out).metadata();
  console.log(`${slug}.webp  ${(buf.length / 1024).toFixed(0)} KB  ${m.width}x${m.height}`);
}

if (args.length === 2) {
  await convert(args[0], args[1]);
} else {
  for (const pair of args) {
    const [src, slug] = pair.split('=');
    await convert(src, slug);
  }
}
