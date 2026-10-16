/**
 * 线上端到端验证：直接加载真实域名，检查 AdSense 是否针对两个 slot 发出请求。
 * 用法： node scripts/verify-live-ads.mjs [路径]
 */
import { spawn } from 'node:child_process';
import path from 'node:path';

const PATHNAME = process.argv[2] ?? '/fix-it/home-repair/recaulk-bathtub/';
const URL_ = `https://tips-for-everyday.com${PATHNAME}`;
const CDP_PORT = 9345;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = path.join(process.env.TEMP ?? '/tmp', 'adslot-live-profile');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fsMod = await import('node:fs');
fsMod.rmSync(PROFILE, { recursive: true, force: true });

// 带上系统代理，否则境内网络无法直连 Google 广告域
const args = [
  '--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  '--window-size=1280,900',
  'about:blank',
];
if (process.env.HTTPS_PROXY) args.push(`--proxy-server=${process.env.HTTPS_PROXY}`);

const chrome = spawn(CHROME, args, { stdio: 'ignore' });

let wsUrl = null;
for (let i = 0; i < 60; i++) {
  await sleep(400);
  try {
    const l = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    const p = l.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
  } catch { /* wait */ }
}
if (!wsUrl) { console.error('DevTools 连接失败'); chrome.kill(); process.exit(1); }

const socket = new WebSocket(wsUrl);
await new Promise((res, rej) => { socket.addEventListener('open', res, { once: true }); socket.addEventListener('error', rej, { once: true }); });
let cmds = 0; const pending = new Map();
socket.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
async function send(method, params = {}) { cmds++; const id = cmds; socket.send(JSON.stringify({ id, method, params })); return new Promise((r) => pending.set(id, r)); }
await send('Runtime.enable'); await send('Page.enable');

console.log(`目标: ${URL_}`);
await send('Page.navigate', { url: URL_ });
await sleep(9000);
await send('Runtime.evaluate', { expression: `window.scrollTo(0, document.body.scrollHeight);` });
await sleep(8000);

const r = await send('Runtime.evaluate', {
  expression: `(() => {
    return [...document.querySelectorAll('ins.adsbygoogle')].map((el) => {
      const b = el.getBoundingClientRect();
      const p = el.closest('.ad-slot');
      const pb = p ? p.getBoundingClientRect() : null;
      return {
        slot: el.getAttribute('data-ad-slot') ?? '(自动广告)',
        status: el.getAttribute('data-ad-status') ?? '(未设置)',
        ins: Math.round(b.width) + '×' + Math.round(b.height),
        parent: pb ? Math.round(pb.width) + '×' + Math.round(pb.height) : '-',
        iframes: el.querySelectorAll('iframe').length,
      };
    });
  })()`,
  returnByValue: true,
});

console.log('');
console.log('════════ 广告位状态（线上） ════════');
for (const s of r.result?.result?.value ?? []) {
  console.log(`slot=${s.slot}`);
  console.log(`   status=${s.status}  ins=${s.ins}  父容器=${s.parent}  iframe 数=${s.iframes}`);
}

const net = await send('Runtime.evaluate', {
  expression: `(performance.getEntriesByType('resource')||[])
    .filter(e=>/googleads\\.g\\.doubleclick\\.net\\/pagead\\/ads/.test(e.name))
    .map(e=>e.name)`,
  returnByValue: true,
});
console.log('');
console.log('════════ 广告请求 ════════');
const urls = net.result?.result?.value ?? [];
console.log(`请求数: ${urls.length}`);
const names = new Set();
for (const u of urls) {
  const q = new URL(u).searchParams;
  const sn = q.get('slotname');
  if (sn) names.add(sn);
  console.log(`  slotname=${sn ?? '(自动广告)'}  w=${q.get('w') ?? '-'}  h=${q.get('h') ?? '-'}  format=${q.get('format') ?? '-'}`);
}
console.log('');
console.log('════════ 判定 ════════');
for (const want of ['3840545729', '7304313863']) {
  console.log(names.has(want)
    ? `  slot ${want}: 已发起广告请求 ✓（CSS 修复在线生效）`
    : `  slot ${want}: 未发起请求 ✗`);
}

chrome.kill();
process.exit(0);
