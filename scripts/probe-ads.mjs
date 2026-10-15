/**
 * 广告位逐项探针
 * 列出页面上每个 <ins> 的 slot、实际盒模型、data-ad-status，
 * 以及每个广告请求 URL 里携带的 slotname / 尺寸参数，用于判断 AdSense 实际按什么宽度请求。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PAGE = process.argv[2] ?? 'fix-it/home-repair/recaulk-bathtub/index.html';
const ROOT = 'dist';
const PORT = 4402;
const CDP_PORT = 9336;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = path.join(process.env.TEMP ?? '/tmp', 'adslot-probe-profile');

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, url === '/' ? '/index.html' : url);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise((r) => server.listen(PORT, r));

fs.rmSync(PROFILE, { recursive: true, force: true });
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  '--window-size=1280,900', '--proxy-server=direct://', '--proxy-bypass-list=*', 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl = null;
for (let i = 0; i < 50; i++) {
  await sleep(300);
  try {
    const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    const p = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
  } catch { /* wait */ }
}
if (!wsUrl) { console.error('DevTools 连接失败'); server.close(); chrome.kill(); process.exit(1); }

const socket = new WebSocket(wsUrl);
await new Promise((res, rej) => { socket.addEventListener('open', res, { once: true }); socket.addEventListener('error', rej, { once: true }); });
let cmds = 0; const pending = new Map();
socket.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
async function send(method, params = {}) {
  cmds++; const id = cmds;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((res) => pending.set(id, res));
}
await send('Runtime.enable');
await send('Page.enable');
await send('Network.enable');

await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${PAGE}` });
await sleep(7000);

const collect = async (tag) => {
  const r = await send('Runtime.evaluate', {
    expression: `(() => {
      const out = [];
      document.querySelectorAll('ins.adsbygoogle').forEach((el, i) => {
        const b = el.getBoundingClientRect();
        const parent = el.closest('.ad-slot');
        const pb = parent ? parent.getBoundingClientRect() : null;
        out.push({
          i, slot: el.getAttribute('data-ad-slot'), format: el.getAttribute('data-ad-format'),
          status: el.getAttribute('data-ad-status') ?? '(未设置)',
          insW: Math.round(b.width), insH: Math.round(b.height),
          parentW: pb ? Math.round(pb.width) : null, parentH: pb ? Math.round(pb.height) : null,
          iframes: el.querySelectorAll('iframe').length,
        });
      });
      return out;
    })()`,
    returnByValue: true,
  });
  console.log(`════════ ${tag} ════════`);
  for (const s of r.result?.result?.value ?? []) {
    console.log(`#${s.i} slot=${s.slot ?? '(自动广告)'} format=${s.format ?? '-'}`);
    console.log(`     status=${s.status}  ins=${s.insW}×${s.insH}  父容器=${s.parentW}×${s.parentH}  iframe 数=${s.iframes}`);
  }
  console.log('');
};

await collect('首屏状态');

// 滚动到底部，触发视口外广告位的懒加载
await send('Runtime.evaluate', { expression: `window.scrollTo(0, document.body.scrollHeight);` });
await sleep(6000);
await collect('滚动到底部后');

const net = await send('Runtime.evaluate', {
  expression: `(performance.getEntriesByType('resource')||[])
    .filter(e=>/googleads\\.g\\.doubleclick\\.net\\/pagead\\/ads/.test(e.name))
    .map(e=>e.name)`,
  returnByValue: true,
});
console.log('');
console.log('════════ 广告请求参数 ════════');
const urls = net.result?.result?.value ?? [];
console.log(`请求数: ${urls.length}`);
for (const u of urls) {
  const q = new URL(u).searchParams;
  const keys = ['slotname', 'w', 'h', 'format', 'client'];
  console.log('  ' + keys.map((k) => `${k}=${q.get(k) ?? '-'}`).join('  '));
}

server.close(); chrome.kill(); process.exit(0);
