/**
 * AdSense 填充诊断：在真实浏览器里跑一遍，区分「没发请求」和「发了请求但没填充」。
 *
 * 用法：
 *   NODE_PATH="C:/Users/tumu1/.workbuddy/binaries/node/workspace/node_modules" \
 *   node scripts/ad-check.mjs [url] [--width=1440] [--no-scroll]
 *
 * 判定要点：
 *   - display=none 或容器宽高为 0  → 实现问题，AdSense 不会发请求
 *   - 有 pagead/ads 请求但 data-ad-status=unfilled → 请求到了 Google，是投放侧问题
 *     （地域、账号状态、广告单元新建未生效），不要去改 CSS
 *   - 该位没有 slotname 请求 → 才是真的没被 push / 被同页去重
 *
 * 重要（2026-10-24 修正）：
 *   必须逐屏滚动。AdSense 对可视区外的单元启用懒加载，不滚动就永远不发请求，
 *   会让正文中部的单元被误判成「没被 push」。旧版不滚动，曾据此错误得出
 *   「③ 无请求、应当删除」的结论；滚动后实测 ③ 请求正常。
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--')) || 'https://tips-for-everyday.com/';
const widthArg = args.find((a) => a.startsWith('--width='));
const width = widthArg ? Number(widthArg.split('=')[1]) : 1440;
const doScroll = !args.includes('--no-scroll');

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
await page.waitForTimeout(8000);

// 逐屏滚动到页底再回到顶部，触发正文中部单元
if (doScroll) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 700) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(2500);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(5000);
}

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

// 按 slotname 汇总请求，判定「真的没发请求」还是「发了但没填充」
const perSlot = new Map();
for (const q of adReqs) {
  if (!/pagead\/ads\?/.test(q.u)) continue;
  const m = q.u.match(/[?&]slotname=([^&]*)/);
  if (!m) continue;
  perSlot.set(m[1], (perSlot.get(m[1]) || 0) + 1);
}

console.log(`\n页面 ${url}  （视口 ${width}px${doScroll ? '，已滚动触发懒加载' : '，未滚动'}）`);
console.log(`广告位 ${r.total} 个\n`);
console.log('  #  格式        slot          尺寸       push  ad-status  iframe  请求');
for (const s of r.slots) {
  const n = perSlot.get(String(s.slot)) || 0;
  console.log(
    `  ${String(s.i).padEnd(2)} ${s.fmt.padEnd(11)} ${String(s.slot).padEnd(12)} ` +
      `${String(s.w + 'x' + s.h).padEnd(9)} ${String(s.pushed).padEnd(5)} ` +
      `${String(s.status).padEnd(9)} ${String(s.ifr).padEnd(6)} ${n}`
  );
}

const adsReqs = adReqs.filter((x) => /pagead\/ads\?/.test(x.u));
const loader = adReqs.filter((x) => /adsbygoogle\.js/.test(x.u));
console.log(`\nadsbygoogle.js: ${loader.length ? loader[0].s : '未加载'}`);
console.log(`pagead/ads 请求: ${adsReqs.length} 条（分布在 ${perSlot.size} 个 slotname）`);

const hidden = r.slots.filter((s) => s.display === 'none' || s.w === 0 || s.h === 0);
const unfilled = r.slots.filter((s) => s.status === 'unfilled');
const noReq = r.slots.filter((s) => !(perSlot.get(String(s.slot)) > 0));
const noIframe = r.slots.filter((s) => s.ifr === 0);

console.log('\n判定：');
if (hidden.length) console.log(`  ✗ ${hidden.length} 个广告位不可见或尺寸为 0 —— 实现问题，检查 CSS`);
if (noReq.length)
  console.log(
    `  ✗ ${noReq.length} 个位没有发出任何请求 —— 实现问题（未 push / 同页去重）：${noReq.map((s) => s.slot).join(', ')}`
  );
if (!noReq.length && !hidden.length) console.log('  ✓ 全部广告位都已发出请求，实现层正常');
if (unfilled.length === r.slots.length && adsReqs.length)
  console.log(`  ! 全部 ${unfilled.length} 个位 unfilled —— 整页零填充，几乎一定是地域/账号问题（如在不受支持的地区访问），不是代码问题`);
else if (unfilled.length)
  console.log(`  ! ${unfilled.length} 个位 unfilled —— 投放侧问题（地域/账号/单元未生效），改 CSS 无用`);
if (noIframe.length) console.log(`  ! ${noIframe.length} 个位没有 iframe —— 请求未返回渲染结果`);

await browser.close();
