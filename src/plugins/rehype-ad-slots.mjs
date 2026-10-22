/**
 * rehype 插件：在正文的 H2 之间注入广告位。
 *
 * 背景：原先两个广告位都挂在 ArticleLayout 上——一个在 `.article-body` 之前
 * （读者一个字都还没读到就先看到广告），一个在 `.article-body` 之后（实际是
 * 文末，标称「正文中」名不符实）。真正意义上的「正文内」广告位一个都没有。
 *
 * 这里改成按标题位置注入，位置随文章长度自适应：
 *   - ① 第 1 个 H2 之前（= 引言读完之后，不再压标题）· 展示广告 响应式
 *   - ② 约 35% 处（H2 ≥ 6）· 文章内嵌广告 in-article
 *   - ③ 约 75% 处（H2 ≥ 10）· 展示广告 响应式
 *   - ④ 正文结尾（FAQ 之前）· 展示广告 响应式
 *
 * 用 rehype 而不是在 layout 里切 slot 的原因：正文是 markdown 渲染出来的一整块，
 * 布局层拿不到 H2 的位置；rehype 阶段能拿到完整节点树，注入点稳定且可复现。
 *
 * 四个位置必须各用独立单元 ID：曾全部复用同一个单元，实测被 AdSense 去重，
 * 同页 4 个位里 2 个始终拿不到 data-ad-status。
 */

function el(tagName, properties, children = []) {
  return { type: 'element', tagName, properties, children: [].concat(children) };
}

function txt(value) {
  return { type: 'text', value };
}

/**
 * 单个广告位节点。
 * 结构与 AdSlot.astro 保持一致，便于 CSS 与预检统一识别 `class="ad-slot`。
 *
 * data-ad-position 仅用于调试与预检（区分位置），AdSense 会忽略未知属性。
 */
function adNode(client, slot, variant, opts = {}) {
  const {
    position = '',
    adFormat = 'auto',
    adLayout = '',
    layoutKey = '',
    fullWidth = true,
  } = opts;

  const insProps = {
    className: ['adsbygoogle'],
    style: 'display:block',
    'data-ad-client': client,
    'data-ad-slot': slot,
  };
  if (position) insProps['data-ad-position'] = position;
  if (adFormat) insProps['data-ad-format'] = adFormat;
  if (adLayout) insProps['data-ad-layout'] = adLayout;
  if (layoutKey) insProps['data-ad-layout-key'] = layoutKey;
  // 信息流与文章内嵌单元不能用全宽响应式：会让尺寸跳出栅格 / 正文字宽
  if (fullWidth) insProps['data-full-width-responsive'] = 'true';

  return el('div', { className: ['ad-slot', `ad-slot--${variant}`], 'data-ad-slot': slot }, [
    el('span', { className: ['ad-slot__label'] }, [txt('Advertisement')]),
    el('ins', insProps, []),
  ]);
}

/** 单元 ID 是否为可用的真实值 */
function usable(slot) {
  return Boolean(slot) && slot.length >= 6 && !/^(\d)\1+$/.test(slot);
}

export default function rehypeAdSlots(options = {}) {
  const { client = '', slots = {}, layoutKeys = {} } = options;

  // 未配置发布商 ID 就整体跳过，不留空壳节点
  if (!client || client.includes('XXXX')) return () => {};

  return (tree) => {
    if (!Array.isArray(tree.children)) return;

    // 顶级 H2 的位置（正文里的章节标题都在这一层）
    const h2 = [];
    tree.children.forEach((node, i) => {
      if (node.type === 'element' && node.tagName === 'h2') h2.push(i);
    });
    const n = h2.length;
    if (n === 0) return;

    // 每个位置对应的单元与形态参数。
    // 文章普遍 9–14 个 H2（每节约 200–300 词），按 0 / 35% / 75% / 结尾分布，
    // 大约每 500–700 词一个广告位；短文章只在开头和结尾各放一个。
    const plan = [];
    if (usable(slots.articleTop)) {
      plan.push({ at: h2[0], position: 'top', slot: slots.articleTop });
    }
    if (n >= 6 && usable(slots.articleMid)) {
      plan.push({
        at: h2[Math.max(2, Math.round(n * 0.35))],
        position: 'mid',
        slot: slots.articleMid,
        // 文章内嵌广告：fluid + in-article，不带全宽响应式
        adFormat: 'fluid',
        adLayout: 'in-article',
        fullWidth: false,
      });
    }
    if (n >= 10 && usable(slots.articleLate)) {
      const late = Math.max(Math.round(n * 0.35) + 1, Math.round(n * 0.75));
      if (late <= n - 1) {
        plan.push({ at: h2[late], position: 'late', slot: slots.articleLate });
      }
    }

    // 同一索引只保留一个（短文章里百分比位置可能撞车）
    const before = new Map();
    for (const item of plan) {
      if (item.at === undefined) continue;
      before.set(
        item.at,
        adNode(client, item.slot, 'inline', {
          position: item.position,
          adFormat: item.adFormat ?? 'auto',
          adLayout: item.adLayout ?? '',
          fullWidth: item.fullWidth ?? true,
        })
      );
    }

    const out = [];
    tree.children.forEach((node, i) => {
      if (before.has(i)) out.push(before.get(i));
      out.push(node);
    });

    // ④ 末位：正好落在 FAQ 组件之前
    if (usable(slots.articleEnd)) {
      out.push(
        adNode(client, slots.articleEnd, 'inline', {
          position: 'end',
          adFormat: 'auto',
          fullWidth: true,
        })
      );
    }

    tree.children = out;
  };
}
