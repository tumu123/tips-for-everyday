/**
 * IndexNow 推送脚本（Bing / Yandex / Seznam 共用协议）。
 *
 * 用法：
 *   node scripts/indexnow.mjs                      # 推送 sitemap 中最近 7 天有变化的 URL 不可行，改为手动列表
 *   node scripts/indexnow.mjs /path/to/a/ /path/to/b/
 *
 * 密钥文件：public/b635720be3792ceb7b998bb4b86c39d0.txt（内容与文件名一致），
 * 已随站点部署到 https://tips-for-everyday.com/<key>.txt。
 * 返回 200/202 表示接受；403 表示密钥文件不可达或内容不符。
 */
const HOST = 'tips-for-everyday.com';
const KEY = 'b635720be3792ceb7b998bb4b86c39d0';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const paths = process.argv.slice(2);
if (!paths.length) {
  console.error('用法: node scripts/indexnow.mjs <路径1> [路径2 ...]');
  process.exit(1);
}

// Git Bash 会把以 / 开头的参数改写成 Windows 盘符路径（C:/.../Git/fix-it/...）。
// 用 dist 顶层目录反推合法路由段，把参数截断到真正的路由起点。
import fs from 'node:fs';
const TOP = new Set(
  fs.readdirSync('dist', { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)
);

function normalize(p) {
  let s = p.replace(/\\/g, '/');
  const m = s.match(/^https?:\/\/[^/]+(\/.*)$/);
  if (m) s = m[1];
  const segs = s.split('/').filter(Boolean);
  const i = segs.findIndex((seg) => TOP.has(seg));
  if (i === -1) {
    console.error(`✗ 无法识别路由段: ${p}`);
    process.exit(1);
  }
  return '/' + segs.slice(i).join('/') + (s.endsWith('/') ? '/' : '');
}

const urlList = paths.map((p) => `https://${HOST}${normalize(p)}`);

const body = {
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList,
};

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

console.log(`HTTP ${res.status} — 推送 ${urlList.length} 条`);
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
for (const u of urlList) console.log('  ' + u);
