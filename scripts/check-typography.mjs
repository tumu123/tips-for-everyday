// 一次性体检：检查全部 markdown 是否存在「被剥离非 ASCII」的痕迹
// 判据：① 正文行内异常双空格  ② 温度数字缺度数符号  ③ 占位符残留  ④ CJK 混入
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const problems = [];

for (const f of files) {
  const t = fs.readFileSync(path.join(DIR, f), 'utf8');
  const lines = t.split(/\r?\n/);

  // 定位 frontmatter 结束行
  let bodyStart = 0;
  if (lines[0]?.trim() === '---') {
    for (let j = 1; j < lines.length; j++) {
      if (lines[j].trim() === '---') { bodyStart = j + 1; break; }
    }
  }
  const body = lines.slice(bodyStart);

  let inFence = false;
  body.forEach((line, idx) => {
    const ln = bodyStart + idx + 1;

    // 跳过代码块（内部对齐空格是有意为之）
    if (/^\s*```/.test(line)) { inFence = !inFence; return; }
    if (inFence) return;

    // ① 行内异常双空格（Markdown 表格缩进之外）
    if (/\S {2,}\S/.test(line) && !/^\s*\|/.test(line)) {
      problems.push(`${f}:${ln} [双空格] ${line.trim().slice(0, 80)}`);
    }
    // ② 温度缺度数符号：数字直接跟 F/C，且前面是 (° 之外的字符
    const m = line.match(/(?<!\d°)(\b\d{2,3})([FC])\b/g);
    if (m) {
      problems.push(`${f}:${ln} [缺度数] ${m.join(', ')} :: ${line.trim().slice(0, 80)}`);
    }
    // ③ 占位符残留
    if (/hy_placeholder|<\w+_?no\d+>/i.test(line)) {
      problems.push(`${f}:${ln} [占位符] ${line.trim().slice(0, 80)}`);
    }
    // ④ CJK 混入
    if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(line)) {
      problems.push(`${f}:${ln} [中文] ${line.trim().slice(0, 80)}`);
    }
    // ⑤ 疑似 en-dash 被压扁：数字紧贴数字（排除日期/年份/常规数字）
    if (/\b\d{4,}(?:\s*(?:hours|lb|pounds|times|minutes|days|weeks|years|oz|inches))\b/.test(line)) {
      problems.push(`${f}:${ln} [疑似压扁区间] ${line.trim().slice(0, 80)}`);
    }
  });
}

if (problems.length === 0) {
  console.log(`体检通过：${files.length} 篇全部干净 ✓`);
} else {
  console.log(`发现 ${problems.length} 处可疑：`);
  problems.forEach((p) => console.log('  ' + p));
  process.exit(1);
}
