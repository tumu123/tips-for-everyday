#!/usr/bin/env node
// Google Search Console 只读拉取工具（service account 认证）
// 用法：
//   node scripts/gsc.mjs sites
//   node scripts/gsc.mjs sitemaps [siteUrl]
//   node scripts/gsc.mjs query [siteUrl] [days] [dimensions]
//   node scripts/gsc.mjs pages [siteUrl] [days]
//   node scripts/gsc.mjs inspect [siteUrl] <url...>
// 凭据路径通过环境变量 GSC_KEY 指定，默认读 GSC_KEY_PATH。

import crypto from 'node:crypto';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const KEY_PATH = process.env.GSC_KEY || 'D:/workbuddy chengguo/2026-10-08-08-18-46/.workbuddy/cobalt-bliss-456512-a3-857d00af2d60.json';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const DEFAULT_SITE = 'sc-domain:tips-for-everyday.com';

const key = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));

function b64u(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: key.client_email,
    scope: SCOPE,
    aud: key.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const data = `${b64u(JSON.stringify(header))}.${b64u(JSON.stringify(payload))}`;
  const sig = crypto.createSign('RSA-SHA256').update(data).sign(key.private_key);
  return `${data}.${b64u(sig)}`;
}

// ── 传输层 ────────────────────────────────────────────────────────────────
// 本机到 Google 的直连在 TLS 层被 SNI 阻断（裸 IP 能握手，带域名 SNI 即被重置）。
// 绕过方式：请求发往固定 IP，TLS 层不带 SNI，靠 HTTP Host 头做虚���主机路由。
// 代价是证书域名为默认证书，需 -k 跳过校验，因此这里只做只读查询，且响应
// 必须是可解析的 JSON，异常即中止。需要切回正常网络时设 GSC_USE_FETCH=1。
const GSC_IP = process.env.GSC_IP || '142.250.66.234';
const USE_FETCH = process.env.GSC_USE_FETCH === '1';
const MARKER = '@@STATUS@@';

function curlRequest(url, { method = 'GET', headers = {}, body = null } = {}) {
  const u = new URL(url);
  const args = ['-sS', '-m', '60', '-k', '--http1.1', '-X', method, '-H', `Host: ${u.host}`];
  for (const [k, v] of Object.entries(headers)) args.push('-H', `${k}: ${v}`);
  if (body !== null && body !== undefined) args.push('--data-binary', body);
  args.push('-w', `\n${MARKER}%{http_code}`);
  args.push(`https://${GSC_IP}${u.pathname}${u.search}`);

  let out;
  try {
    out = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
  } catch (e) {
    out = (e.stdout || '').toString();
    if (!out) throw new Error(`curl 执行失败: ${e.message}`);
  }
  const idx = out.lastIndexOf(MARKER);
  const text = idx >= 0 ? out.slice(0, idx) : out;
  const status = idx >= 0 ? Number(out.slice(idx + MARKER.length).trim()) : 0;
  return { status, text };
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`响应不是 JSON（可能证书被替换或 IP 失效）：${text.slice(0, 200)}`);
  }
}

async function getToken() {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: makeJwt(),
  }).toString();

  if (USE_FETCH) {
    const res = await fetch(key.token_uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`token 获取失败 ${res.status}: ${JSON.stringify(json)}`);
    return json.access_token;
  }

  const { status, text } = curlRequest(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = parseJson(text);
  if (status !== 200) throw new Error(`token 获取失败 ${status}: ${JSON.stringify(json).slice(0, 400)}`);
  return json.access_token;
}

async function api(token, url, opts = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    ...(opts.headers || {}),
  };

  if (USE_FETCH) {
    const res = await fetch(url, { ...opts, headers });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = text; }
    if (!res.ok) {
      const err = new Error(`API ${res.status}: ${JSON.stringify(json).slice(0, 500)}`);
      err.status = res.status;
      throw err;
    }
    return json;
  }

  const { status, text } = curlRequest(url, { method: opts.method || 'GET', headers, body: opts.body });
  if (status < 200 || status >= 300) {
    const err = new Error(`API ${status}: ${text.slice(0, 500)}`);
    err.status = status;
    throw err;
  }
  return parseJson(text);
}

function dateStr(daysAgo) {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.toISOString().slice(0, 10);
}

const [cmd, ...rest] = process.argv.slice(2);
let site = DEFAULT_SITE;
if (rest[0] && (rest[0].startsWith('sc-domain:') || (cmd !== 'inspect' && rest[0].startsWith('http')))) {
  site = rest.shift();
}

try {
  if (cmd === 'token') {
    await getToken();
    console.log('认证成功');
  } else if (cmd === 'sites') {
    const t = await getToken();
    const data = await api(t, 'https://www.googleapis.com/webmasters/v3/sites');
    const list = data.siteEntry || [];
    console.log(`共 ${list.length} 个站点属性：`);
    for (const s of list) console.log(`  ${s.siteUrl}  [${s.permissionLevel}]`);
  } else if (cmd === 'sitemaps') {
    const t = await getToken();
    const data = await api(t, `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps`);
    const list = data.sitemap || [];
    console.log(`站点: ${site} | sitemap 数: ${list.length}`);
    for (const s of list) {
      console.log(`\n  ${s.path}`);
      console.log(`    type=${s.type}  submitted=${s.lastSubmitted || '-'}  downloaded=${s.lastDownloaded || '-'}`);
      if (s.contents) console.log(`    contents: ${s.contents.map(c => `${c.type}=${c.submitted}/${c.indexed ?? '?'}`).join(', ')}`);
      if (s.errors) console.log(`    errors=${s.errors}  warnings=${s.warnings}`);
    }
  } else if (cmd === 'query' || cmd === 'pages') {
    const days = Number(rest[0] || 28);
    const dims = cmd === 'pages' ? ['page'] : (rest[1] ? rest[1].split(',') : ['query']);
    const t = await getToken();
    const body = {
      startDate: process.env.GSC_START || dateStr(days + 3),
      endDate: process.env.GSC_END || dateStr(3),
      dimensions: dims,
      rowLimit: 1000,
      dataState: 'final',
    };
    const data = await api(t, `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const rows = data.rows || [];
    console.log(`站点: ${site} | 区间: ${body.startDate} ~ ${body.endDate} | 维度: ${dims.join(',')} | 行数: ${rows.length}`);
    if (!rows.length) {
      console.log('  无数据（可能是零展示，或未编入索引，或数据未就绪）');
    } else {
      let clicks = 0, imps = 0;
      for (const r of rows) { clicks += r.clicks; imps += r.impressions; }
      console.log(`  合计点击 ${clicks} | 合计展示 ${imps} | 唯一 ${dims[0]} 数 ${rows.length}`);
      console.log('');
      for (const r of rows.slice(0, Number(process.env.TOP || 40))) {
        const k = r.keys.join(' | ');
        console.log(`  ${String(r.clicks).padStart(4)} 点击  ${String(r.impressions).padStart(6)} 展示  pos ${r.position ? r.position.toFixed(1) : '-'}  ${k}`);
      }
    }
  } else if (cmd === 'inspect') {
    const t = await getToken();
    const target = rest;
    if (!target.length) throw new Error('inspect 需要至少一个 URL');
    for (const u of target) {
      const data = await api(t, 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST',
        body: JSON.stringify({ inspectionUrl: u, siteUrl: site || DEFAULT_SITE }),
      });
      const r = data.inspectionResult?.indexStatusResult || {};
      console.log(`\n${u}`);
      console.log(`  verdict=${r.verdict}  coverage=${r.coverageState}  robots=${r.robotsTxtState}  indexing=${r.indexingState}`);
      console.log(`  lastCrawl=${r.lastCrawlTime || '-'}  canonical=${r.googleCanonical || '-'}`);
      if (r.crawledAs) console.log(`  crawledAs=${r.crawledAs}`);
    }
  } else {
    console.log('用法: node scripts/gsc.mjs <sites|sitemaps|query|pages|inspect> [siteUrl] [参数]');
  }
} catch (e) {
  console.error(`[FAIL] ${e.message}`);
  if (e.status === 403) {
    console.error('提示: service account 未被加入 Search Console 用户列表，或未接受邀请。');
  }
  process.exit(1);
}
