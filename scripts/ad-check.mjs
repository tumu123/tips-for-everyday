/**
 * AdSense 填充诊断：在真实浏览器里跑一遍，区分「没发请求」和「发了请求但没填充」。
 *
 * 用法：
 *   NODE_PATH="C:/Users/tumu1/.workbuddy/binaries/node/workspace/node_modules" \
 *   node scripts/ad-check.mjs [url] [--width=1440]
 *
 * 判定要点：
 *   - display=none 或容器宽高为 0  → 实现问题，AdSense 不会发请求
 *   - 有 pagead/ads 请求但 data-ad-status=unfilled → 请求到了 Google，是投放侧问题
 *     （地域、账号状态、广告单元新建未生效），不要去改 CSS
 *   - data-ad-status 一直是 null 且没有请求 → 该单元没被 push 或同 slot 去重
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--')) || 'https://tips-for-everyday.com/';
const widthArg = args.find((a) => a.startsWith('--width='));
const width = widthArg ? Number(widthArg.split('=')[1]) : 1440;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width, height: 900 },
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  locale: 'en-US',
});
const page = await ctx.newPage();

const adReqs = [];
page.on('response', (r) => {
  const u = r.url();
  if (/pagead\/ads\?/.test(u) || /pagead\/js\/adsbygoogle\.js/.test(u)) {
    adReqs.push({ u, s: r.status() });
  }
});

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) =>
  console.log('导航失败:', e.message.slice(0, 100))
);
await page.waitForTimeout(15000);

const r = await page.evaluate(() => {
  const slots = [...document.querySelectorAll('.ad-slot')].map((d, i) => {
    const ins = d.querySelector('ins.adsbygoogle');
    const cs = getComputedStyle(d);
    const rect = d.getBoundingClientRect();
    return {
      i,
      fmt: [...d.classList].find((c) => c.startsWith('ad-slot--'))?.replace('ad-slot--', '') || 'auto',
      slot: d.getAttribute('data-ad-slot'),
      display: cs.display,
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      status: ins ? ins.getAttribute('data-ad-status') : '(no ins)',
      pushed: ins ? ins.getAttribute('data-adsbygoogle-status') : null,
      ifr: ins ? ins.querySelectorAll('iframe').length : 0,
    };
  });
  return { slots, total: document.querySelectorAll('.ad-slot').length };
});

console.log(`\n页面 ${url}  （视口 ${width}px）`);
console.log(`广告位 ${r.total} 个\n`);
console.log('  #  格式        slot          display  尺寸        push  ad-status   iframe');
for (const s of r.slots) {
  console.log(
    `  ${String(s.i).padEnd(2)} ${s.fmt.padEnd(11)} ${String(s.slot).padEnd(13)} ` +
      `${String(s.display).padEnd(8)} ${String(s.w + 'x' + s.h).padEnd(10)} ` +
      `${String(s.pushed).padEnd(5)} ${String(s.status).padEnd(9)} ${s.ifr}`
  );
}

const adsReqs = adReqs.filter((x) => /pagead\/ads\?/.test(x.u));
const loader = adReqs.filter((x) => /adsbygoogle\.js/.test(x.u));
console.log(`\nadsbygoogle.js: ${loader.length ? loader[0].s : '未加载'}`);
console.log(`pagead/ads 请求: ${adsReqs.length} 条`);
for (const q of adsReqs.slice(0, 8)) {
  const p = q.u.match(/[?&](h|slotname|num_ads)=([^&]*)/g) || [];
  console.log(`  ${q.s} ${p.join(' ')}`);
}

const hidden = r.slots.filter((s) => s.display === 'none' || s.w === 0 || s.h === 0);
const unfilled = r.slots.filter((s) => s.status === 'unfilled');
const noStatus = r.slots.filter((s) => s.status === null || s.status === undefined);
console.log('\n判定：');
if (hidden.length) console.log(`  ✗ ${hidden.length} 个广告位不可见或尺寸为 0 —— 实现问题，检查 CSS`);
if (unfilled.length && adsReqs.length)
  console.log(`  ! ${unfilled.length} 个已发请求但 unfilled —— 投放侧问题（地域/账号/单元未生效），改 CSS 无用`);
if (noStatus.length) console.log(`  ! ${noStatus.length} 个始终没有 ad-status —— 没被 push 或同 slot 去重`);
if (!hidden.length && !unfilled.length && !noStatus.length) console.log('  ✓ 全部已填充');

await browser.close();
