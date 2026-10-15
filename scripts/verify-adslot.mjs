/**
 * 广告位宽度塌陷实测
 *
 * 用无头 Chrome 加载本地 dist 页面，测量 .ad-slot 与其内部 <ins> 的实际盒模型尺寸，
 * 并通过逐级对照实验，定位宽度塌陷的真正成因。
 *
 * 用法： node scripts/verify-adslot.mjs [相对 dist 的页面路径]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PAGE = process.argv[2] ?? 'fix-it/home-repair/recaulk-bathtub/index.html';
const ROOT = 'dist';
const PORT = 4399;
const CDP_PORT = 9333;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = path.join(process.env.TEMP ?? '/tmp', 'adslot-verify-profile');

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, url === '/' ? '/index.html' : url);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    res.end(data);
  });
});

await new Promise((r) => server.listen(PORT, r));

fs.rmSync(PROFILE, { recursive: true, force: true });
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1280,900',
  '--proxy-server=direct://',
  '--proxy-bypass-list=*',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 等待 DevTools 就绪，并取「页面级」target（Runtime.evaluate 需要页面 target，而非浏览器端点）
let wsUrl = null;
for (let i = 0; i < 50; i++) {
  await sleep(300);
  try {
    const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    if (page) { wsUrl = page.webSocketDebuggerUrl; break; }
  } catch { /* 尚未就绪 */ }
}
if (!wsUrl) {
  console.error('无法连接 Chrome 页面级 DevTools');
  server.close(); chrome.kill(); process.exit(1);
}

const socket = new WebSocket(wsUrl);
await new Promise((res, rej) => {
  socket.addEventListener('open', res, { once: true });
  socket.addEventListener('error', rej, { once: true });
});

let cmds = 0;
const pending = new Map();
socket.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

function send(method, params = {}) {
  cmds += 1;
  const id = cmds;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((res) => pending.set(id, res));
}

await send('Runtime.enable');
await send('Page.enable');

async function measure() {
  const r = await send('Runtime.evaluate', {
    expression: `(() => {
      const box = document.querySelector('.ad-slot');
      const ins = box && box.querySelector('ins.adsbygoogle');
      const cs = box && getComputedStyle(box);
      const rect = (el) => { const b = el.getBoundingClientRect(); return Math.round(b.width) + '×' + Math.round(b.height); };
      return {
        found: !!box,
        slotDisplay: cs && cs.display,
        slotFlexDir: cs && cs.flexDirection,
        slotMinHeight: cs && cs.minHeight,
        slotBox: box ? rect(box) : null,
        insDisplay: ins ? getComputedStyle(ins).display : null,
        insWidth: ins ? getComputedStyle(ins).width : null,
        insBox: ins ? rect(ins) : null,
        insStatus: ins ? ins.getAttribute('data-ad-status') : null,
      };
    })()`,
    returnByValue: true,
  });
  return r.result?.result?.value;
}

const show = (title, m) => {
  console.log(`──── ${title} ────`);
  console.log(`父容器 .ad-slot   display=${m.slotDisplay}  flex-direction=${m.slotFlexDir}  min-height=${m.slotMinHeight}  实测=${m.slotBox}`);
  console.log(`插入位 <ins>      display=${m.insDisplay}  width=${m.insWidth}  实测=${m.insBox}  data-ad-status=${m.insStatus ?? '(无)'}`);
  console.log('');
};

console.log('════════ 时序测试：0 宽状态下 AdSense 是否发起请求 ════════');
const NETQ = `(performance.getEntriesByType('resource')||[])
  .filter(e=>/googleads\\.g\\.doubleclick\\.net\\/pagead\\/ads/.test(e.name))
  .map(e=>e.name)`;

// 干净重载一轮，不做任何样式改动，静置观察
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${PAGE}` });
await sleep(6000);
const cleanState = await measure();
const cleanNet = await send('Runtime.evaluate', { expression: NETQ, returnByValue: true });
console.log(`未改动时  容器=${cleanState.slotBox}  ins=${cleanState.insBox}  data-ad-status=${cleanState.insStatus ?? '(无)'}`);
console.log(`          广告请求数 = ${cleanNet.result?.result?.value?.length ?? 0}`);
((cleanNet.result?.result?.value) ?? []).slice(0, 3).forEach((n) => console.log('          →', n.slice(0, 120)));
console.log('');
show('基线：站点原样', cleanState);

await send('Runtime.evaluate', { expression: `document.querySelector('.ad-slot').style.display='block';` });
await sleep(400);
show('对照① 仅把父容器改为 display:block', await measure());

await send('Runtime.evaluate', { expression: `document.querySelector('.ad-slot ins.adsbygoogle').style.width='100%';` });
await sleep(400);
show('对照② 再给 ins 加 width:100%', await measure());

await send('Runtime.evaluate', { expression: `document.querySelector('.ad-slot').style.minHeight='90px';` });
await sleep(400);
show('对照③ 再恢复 min-height:90px', await measure());

console.log('════════ 广告相关网络请求 ════════');
const netlog = await send('Runtime.evaluate', {
  expression: `(performance.getEntriesByType('resource')||[])
    .filter(e=>/doubleclick|googlesyndication|pagead/.test(e.name))
    .map(e=>e.name.slice(0,140))`,
  returnByValue: true,
});
const names = netlog.result?.result?.value ?? [];
if (names.length === 0) {
  console.log('（本环境未直连 Google 广告域，请求未到达 —— 预期之内，不影响尺寸结论）');
} else {
  names.forEach((n) => console.log('  ', n));
}

server.close();
chrome.kill();
process.exit(0);
