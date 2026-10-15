/**
 * 检查未填充广告位的父容器为何塌缩：对比 min-height 的计算值与 inline 样式。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PAGE = process.argv[2] ?? 'fix-it/home-repair/recaulk-bathtub/index.html';
const ROOT = 'dist'; const PORT = 4405; const CDP_PORT = 9339;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = path.join(process.env.TEMP ?? '/tmp', 'adslot-debug-profile');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, url === '/' ? '/index.html' : url);
  fs.readFile(file, (e, d) => {
    if (e) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    res.end(d);
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
    const l = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    const p = l.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
  } catch { /* wait */ }
}
if (!wsUrl) { console.error('连接失败'); server.close(); chrome.kill(); process.exit(1); }
const socket = new WebSocket(wsUrl);
await new Promise((res, rej) => { socket.addEventListener('open', res, { once: true }); socket.addEventListener('error', rej, { once: true }); });
let cmds = 0; const pending = new Map();
socket.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
async function send(method, params = {}) { cmds++; const id = cmds; socket.send(JSON.stringify({ id, method, params })); return new Promise((r) => pending.set(id, r)); }
await send('Runtime.enable'); await send('Page.enable');

await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${PAGE}` });
await sleep(5000);
await send('Runtime.evaluate', { expression: `window.scrollTo(0, document.body.scrollHeight);` });
await sleep(6000);

const r = await send('Runtime.evaluate', {
  expression: `(() => {
    return [...document.querySelectorAll('.ad-slot')].map((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const ins = el.querySelector('ins');
      const ics = ins ? getComputedStyle(ins) : null;
      return {
        cls: el.className,
        minHeightComputed: cs.minHeight,
        displayComputed: cs.display,
        inlineStyle: el.getAttribute('style') ?? '(无)',
        box: Math.round(rect.width) + '×' + Math.round(rect.height),
        insDisplay: ics ? ics.display : null,
        insInline: ins ? (ins.getAttribute('style') ?? '(无)') : null,
        insBox: ins ? Math.round(ins.getBoundingClientRect().width) + '×' + Math.round(ins.getBoundingClientRect().height) : null,
      };
    });
  })()`,
  returnByValue: true,
});
console.log('════════ 每个 .ad-slot 的详细样式 ════════');
for (const s of r.result?.result?.value ?? []) {
  console.log(`class         : ${s.cls}`);
  console.log(`  min-height  : 计算值=${s.minHeightComputed}`);
  console.log(`  display     : ${s.displayComputed}   实测盒子=${s.box}`);
  console.log(`  内联样式    : ${s.inlineStyle}`);
  console.log(`  <ins>       : display=${s.insDisplay}  盒子=${s.insBox}`);
  console.log(`  <ins> 内联  : ${s.insInline}`);
  console.log('');
}
server.close(); chrome.kill(); process.exit(0);
