import fs from 'node:fs';
import path from 'node:path';

const out = [];
const log = (s) => out.push(s);

// 硬性失败计数：>0 时进程以非 0 退出，可用作构建门禁
let hardFail = 0;
const fail = (s) => {
  hardFail++;
  out.push(s);
};

// 产物 HTML 清单（多处检查共用）
const files = [];
(function walkDist(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walkDist(p);
    else if (f.endsWith('.html')) files.push(p);
  }
})('dist');

// ── 8. sitemap 与 robots 一致性 ──
log('═══ 预检 8：sitemap 与 robots 一致性 ═══');
const sitemapPath = 'dist/sitemap-0.xml';
if (!fs.existsSync(sitemapPath)) {
  log('sitemap-0.xml 缺失 ✗');
} else {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  log(`sitemap URL 数: ${urls.length}`);

  const excluded = ['privacy-policy', 'terms', 'contact', '404', 'editorial-policy'];
  const bad = urls.filter((u) => excluded.some((e) => u.includes(e)));
  log(bad.length === 0 ? '法务/404 页已正确排除 ✓' : `误收录: ${bad.join(', ')} ✗`);

  // 抽样 URL 是否与实际产物对应
  let missing = 0;
  for (const u of urls) {
    const p = u.replace('https://tips-for-everyday.com', 'dist');
    const candidates = [p + 'index.html', p.replace(/\/$/, '') + '/index.html', p];
    if (!candidates.some((c) => fs.existsSync(c))) {
      log(`sitemap 中 URL 无对应产物: ${u}`);
      missing++;
    }
  }
  log(missing === 0 ? 'sitemap URL 全部有对应产物 ✓' : `${missing} 个 sitemap URL 无产物 ✗`);

  const robots = fs.readFileSync('dist/robots.txt', 'utf8');
  const rm = robots.match(/Sitemap:\s*(\S+)/);
  log(`robots 声明 sitemap: ${rm ? rm[1] : '未声明'}`);
  log(`sitemap-index.xml 存在: ${fs.existsSync('dist/sitemap-index.xml') ? '✓' : '✗'}`);
}

// ── 9. AdSense / GA4 条件注入 ──
log('');
log('═══ 预检 9：AdSense / GA4 配置状态 ═══');
const idx = fs.readFileSync('dist/index.html', 'utf8');
const hasGtag = idx.includes('gtag');

// 从 site-config 读取当前配置状态
const cfg = fs.readFileSync('src/utils/site-config.ts', 'utf8');
const adIdMatch = cfg.match(/adsenseClient:\s*'([^']+)'/);
const gaIdMatch = cfg.match(/ga4MeasurementId:\s*'([^']+)'/);
const adId = adIdMatch ? adIdMatch[1] : null;
const gaId = gaIdMatch ? gaIdMatch[1] : null;

const adPlaceholder = !adId || adId.includes('XXXX');
const gaPlaceholder = !gaId || gaId.includes('XXXX');

log(`AdSense 发布商 ID: ${adPlaceholder ? '仍为占位值 → 上线前必须替换 ✗' : adId + ' ✓'}`);
log(`GA4 衡量 ID: ${gaPlaceholder ? '仍为占位值（可后补，不阻塞上线）' : gaId + ' ✓'}`);

if (!adPlaceholder) {
  log(`首页含 adsbygoogle 脚本: ${idx.includes('adsbygoogle') ? '是 ✓' : '否 ✗'}`);
  log(`产物中无占位 ID 泄露: ${idx.includes('ca-pub-XXXX') ? '否 ✗' : '是 ✓'}`);
} else {
  log(`首页含 adsbygoogle 脚本: ${idx.includes('adsbygoogle') ? '是（异常）✗' : '否 ✓（占位值已阻止注入）'}`);
}
log(`首页含 gtag: ${hasGtag ? '是 ✓' : '否（GA4 未配置）'}`);

// 广告位 slot ID 检查：从 site-config.ts 的 AD_SLOTS 读取
log('');
log('--- 广告单元 slot ID 检查 ---');
const cfgSrc = fs.readFileSync('src/utils/site-config.ts', 'utf8');
const slotsBlock = cfgSrc.match(/export const AD_SLOTS = \{([\s\S]*?)\n\};/);
const slotEntries = slotsBlock
  ? [...slotsBlock[1].matchAll(/(\w+):\s*'([^']*)'/g)].map((m) => [m[1], m[2]])
  : [];

if (slotEntries.length === 0) {
  log('未能解析 AD_SLOTS（请检查 site-config.ts）✗');
} else {
  const filled = slotEntries.filter(([, v]) => v);
  const bad = filled.filter(([, v]) => /^(\d)\1+$/.test(v) || v.length < 6);

  log(`已配置 slot: ${filled.length} / ${slotEntries.length}`);
  for (const [k, v] of slotEntries) {
    log(`  ${v ? '✓' : '○'} ${k} ${v ? `= ${v}` : '（未填 → 该广告位不渲染）'}`);
  }
  if (bad.length) {
    log(`存在格式可疑的 slot ID: ${bad.map(([k, v]) => `${k}=${v}`).join(', ')} ✗`);
  } else if (filled.length === 0) {
    log('→ 广告位当前全部关闭。发布商 ID 已就绪，创建广告单元后填入 AD_SLOTS 即可生效。');
  } else {
    log('slot ID 格式有效 ✓');

    // 校验 slot ID 确实进入了产物（src → dist 全链路通）
    const expectSlots = [...new Set(filled.map(([, v]) => v))];
    for (const sid of expectSlots) {
      const hit = files.some((f) => fs.readFileSync(f, 'utf8').includes(`data-ad-slot="${sid}"`));
      log(`  ${hit ? '✓' : '✗'} slot ${sid} 已进入产物`);
    }
    // 加载器脚本每页只能出现一次
    const multi = [];
    for (const f of files) {
      const n = (fs.readFileSync(f, 'utf8').match(/adsbygoogle\.js\?client=/g) || []).length;
      if (n > 1) multi.push(`${f} (${n} 次)`);
    }
    log(`  ${multi.length === 0 ? '✓' : '✗'} 加载器脚本每页仅注入一次${multi.length ? `：${multi.slice(0, 3).join(', ')}` : ''}`);
  }
}

// ── 10. 域名一致性 ──
log('');
log('═══ 预检 10：域名一致性 ═══');

let wrongDomain = 0;
let sampleShown = 0;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/(?:href|content)="(https?:\/\/[^"]+)"/g)) {
    const u = m[1];
    if (u.includes('tips-for-everyday.com')) continue;
    if (u.includes('schema.org') || u.includes('w3.org')) continue;
    if (u.includes('twitter.com') || u.includes('pinterest.com') || u.includes('facebook.com')) continue;
    if (u.includes('github.com')) continue;
    // 隐私政策 / 广告合规必引用的第三方（AdSense 政策要求的披露链接）
    if (u.includes('google.com/settings/ads')) continue;
    if (u.includes('aboutads.info')) continue;
    if (u.includes('tools.google.com/dlpage/gaoptout')) continue;
    if (u.includes('google.com/policies')) continue;
    if (u.includes('googlesyndication.com')) continue;
    wrongDomain++;
    if (sampleShown < 5) {
      log(`非预期域名引用: ${u.slice(0, 90)}  (${f})`);
      sampleShown++;
    }
  }
}
log(wrongDomain === 0 ? '全部内部引用使用规范域名 ✓' : `发现 ${wrongDomain} 处可疑外部域名引用（见上）`);

// canonical 一致性
const canonBad = [];
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const c = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!c) { canonBad.push(f + ' (无 canonical)'); continue; }
  if (!c[1].startsWith('https://tips-for-everyday.com')) canonBad.push(f + ' -> ' + c[1]);
}
log(canonBad.length === 0 ? '所有页面 canonical 均为规范域名 ✓' : `canonical 异常 ${canonBad.length} 处：${canonBad.slice(0,5).join('; ')}`);

// ── 11. 重复 title / description ──
log('');
log('═══ 预检 11：title 与 description 唯一性 ═══');
const titles = new Map();
const descs = new Map();
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const t = html.match(/<title>([^<]*)<\/title>/);
  const d = html.match(/<meta name="description" content="([^"]*)"/);
  if (t) titles.set(t[1], (titles.get(t[1]) || 0) + 1);
  if (d) descs.set(d[1], (descs.get(d[1]) || 0) + 1);
}
const dupT = [...titles.entries()].filter(([, n]) => n > 1);
const dupD = [...descs.entries()].filter(([, n]) => n > 1);
log(`页面总数: ${files.length} / 唯一 title: ${titles.size} / 唯一 description: ${descs.size}`);
log(dupT.length === 0 ? 'title 全部唯一 ✓' : `title 重复 ${dupT.length} 组：${dupT.slice(0,3).map(([k,n])=>`"${k.slice(0,50)}" x${n}`).join('; ')}`);
log(dupD.length === 0 ? 'description 全部唯一 ✓' : `description 重复 ${dupD.length} 组：${dupD.slice(0,3).map(([k,n])=>`"${k.slice(0,50)}" x${n}`).join('; ')}`);

// ── 12. 结构化数据完整性 ──
log('');
log('═══ 预检 12：结构化数据 JSON-LD 有效性 ═══');
let jsonBad = 0;
let jsonTotal = 0;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    jsonTotal++;
    try {
      JSON.parse(m[1]);
    } catch (e) {
      jsonBad++;
      log(`JSON-LD 解析失败: ${f} — ${e.message.slice(0, 70)}`);
    }
  }
}
log(`JSON-LD 块总数: ${jsonTotal}`);
log(jsonBad === 0 ? '全部 JSON-LD 可正常解析 ✓' : `${jsonBad} 个 JSON-LD 块解析失败 ✗`);

// HowTo 完整性：Google 富媒体结果要求 step 非空
// （曾出现 `## Step N` 因提取规则只认 `### Step N` 而全部丢失的缺陷，此处守门）
let howToTotal = 0;
let howToNoStep = [];
let howToNoTime = [];
let howToNoSupplyOrTool = [];
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j;
    try {
      j = JSON.parse(m[1]);
    } catch (e) {
      continue;
    }
    if (!j || j['@type'] !== 'HowTo') continue;
    howToTotal++;
    const rel = path.relative('dist', f).replace(/\\/g, '/');
    if (!Array.isArray(j.step) || j.step.length === 0) howToNoStep.push(rel);
    if (!j.totalTime) howToNoTime.push(rel);
    if (!(j.supply?.length || j.tool?.length)) howToNoSupplyOrTool.push(rel);
  }
}
log('');
log(`--- HowTo 结构化数据完整性（共 ${howToTotal} 篇） ---`);
log(howToNoStep.length === 0
  ? '所有 HowTo 均含 step 数组 ✓'
  : (fail(`${howToNoStep.length} 篇 HowTo 缺 step（富媒体结果会失效）✗ ${howToNoStep.slice(0, 8).join(', ')}${howToNoStep.length > 8 ? ' …' : ''}`), ''));
log(howToNoTime.length === 0
  ? '所有 HowTo 均含 totalTime ✓'
  : `${howToNoTime.length} 篇 HowTo 缺 totalTime: ${howToNoTime.slice(0, 8).join(', ')}`);
log(howToNoSupplyOrTool.length === 0
  ? '所有 HowTo 均含 supply 或 tool ✓'
  : `${howToNoSupplyOrTool.length} 篇 HowTo 缺 supply/tool: ${howToNoSupplyOrTool.slice(0, 8).join(', ')}`);

// ── 13. 字数与内容体量 ──
log('');
log('═══ 预检 13：文章内容体量 ═══');
const adir = 'src/content/articles';
const mds = fs.readdirSync(adir).filter((f) => f.endsWith('.md'));
let minW = Infinity, maxW = 0, totalW = 0;
const short = [];
for (const f of mds) {
  const t = fs.readFileSync(path.join(adir, f), 'utf8');
  const body = t.split(/^---$/m).slice(2).join('---');
  const w = body.trim().split(/\s+/).filter(Boolean).length;
  totalW += w;
  minW = Math.min(minW, w);
  maxW = Math.max(maxW, w);
  if (w < 1200) short.push(`${f} (${w})`);
}
log(`文章数: ${mds.length} / 正文总词数: ${totalW.toLocaleString()} / 平均: ${Math.round(totalW / mds.length)}`);
log(`最短: ${minW} / 最长: ${maxW}`);
log(short.length === 0 ? '所有文章正文均 ≥1200 词 ✓' : `偏短文章: ${short.join(', ')}`);

// ── 14. FAQ 数量 ──
log('');
log('═══ 预检 14：FAQ 完整度 ═══');
const lowFaq = [];
for (const f of mds) {
  const t = fs.readFileSync(path.join(adir, f), 'utf8');
  // 兼容 "## FAQ" 与 "## Frequently Asked Questions" 两种写法
  const parts = t.split(/^##\s+(?:FAQ|Frequently Asked Questions)\s*$/m);
  const faqSection = parts.length > 1 ? parts[1].split(/^##\s/m)[0] : '';
  const qs = (faqSection.match(/^\*\*[^*]+\?\*\*/gm) || []).length;
  if (qs < 6) lowFaq.push(`${f} (${qs})`);
}
log(lowFaq.length === 0 ? '所有文章 FAQ ≥6 条 ✓' : `FAQ 偏少: ${lowFaq.join(', ')}`);

// FAQPage schema 由 FaqSection 组件自动生成，因此检查渲染产物而非 markdown 源
let artWithSchema = 0;
let artTotal = 0;
for (const f of files) {
  // 仅统计文章页（栏目页路径为 /cat/ 或 /cat/sub/，文章页更深）
  const depth = f.replace(/\\/g, '/').split('/').length - 1; // dist 下层级
  if (depth < 3) continue;
  const html = fs.readFileSync(f, 'utf8');
  if (!html.includes('class="faq')) continue; // 非文章页或无 FAQ 区块
  artTotal++;
  if (html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"')) artWithSchema++;
}
if (artTotal === 0) {
  log('未找到含 FAQ 区块的页面（检查路径层级配置）');
} else {
  log(artWithSchema === artTotal
    ? `FAQPage schema 与 FAQ 区块一一对应（${artWithSchema}/${artTotal}）✓`
    : `${artTotal - artWithSchema}/${artTotal} 个含 FAQ 的页面缺 FAQPage schema ✗`);
}

// ── 15. AdSense 广告位容器布局（防止 width 塌陷回归） ──
log('');
log('═══ 预检 15：广告位容器布局 ═══');
// 曾发生：.ad-slot 被设为 display:flex，导致内部空的 <ins> 作为 flex 子项
// 宽度按 max-content 计算 → 0px → AdSense 不发起请求 → 全站广告永久空白。
const cssFiles = [];
(function walkCss(d) {
  for (const f of fs.readdirSync(d)) {
    const p2 = path.join(d, f);
    if (fs.statSync(p2).isDirectory()) walkCss(p2);
    else if (f.endsWith('.css')) cssFiles.push(p2);
  }
})('dist/_assets');
const adCss = cssFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const baseRule = adCss.match(/\.ad-slot\s*\{([^}]*)\}/);
if (!baseRule) {
  fail('未找到 .ad-slot 基础规则 ✗');
} else {
  const body = baseRule[1];
  const isFlex = /display\s*:\s*(inline-)?flex/.test(body);
  log(isFlex
    ? (fail('.ad-slot 仍为 display:flex —— <ins> 宽度会塌陷为 0，广告不会请求 ✗'), '')
    : '.ad-slot 为 block 布局（<ins> 可撑满宽度）✓');
}
if (/min-height\s*:\s*0\b/.test(adCss)) {
  log('检测到 min-height:0 声明，若为 .ad-slot 的规则会压掉占位高度 ⚠');
}
// 可持续主张：含广告位的页面数量
let pagesWithSlot = 0;
let contentPages = 0;
for (const f of files) {
  const rel = path.relative('dist', f).replace(/\\/g, '/');
  if (/^(?:index|404)\.html$/.test(rel)) continue;
  if (/^(?:about|contact|privacy-policy|terms|editorial-policy)\//.test(rel)) continue;
  contentPages++;
  if (fs.readFileSync(f, 'utf8').includes('class="ad-slot')) pagesWithSlot++;
}
log(contentPages === pagesWithSlot
  ? `${contentPages} 个内容/栏目页全部带广告位（${pagesWithSlot}/${contentPages}）✓`
  : `${contentPages - pagesWithSlot} 个内容页缺广告位（${pagesWithSlot}/${contentPages}）`);

console.log(out.filter((l) => l !== '').join('\n'));
console.log('');
if (hardFail > 0) {
  console.log(`预检结果：${hardFail} 项硬性失败 ✗`);
  process.exit(1);
}
console.log('预检结果：全部硬性检查通过 ✓');
process.exit(0);
