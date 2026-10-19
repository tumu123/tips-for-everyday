/**
 * rehype 插件：在正文的 H2 之间注入广告位。
 *
 * 背景：原先两个广告位都挂在 ArticleLayout 上——一个在 `.article-body` 之前
 * （读者一个字都还没读到就先看到广告），一个在 `.article-body` 之后（实际是
 * 文末，标称「正文中」名不符实）。真正意义上的「正文内」广告位一个都没有。
 *
 * 这里改成按标题位置注入，位置随文章长度自适应：
 *   - 第 1 个 H2 之前（= 引言读完之后，不再压标题）
 *   - 约 40% 处
 *   - 约 75% 处
 *   - 正文结尾（FAQ 之前）
 *
 * 用 rehype 而不是在 layout 里切 slot 的原因：正文是 markdown 渲染出来的一整块，
 * 布局层拿不到 H2 的位置；rehype 阶段能拿到完整节点树，注入点稳定且可复现。
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
 */
function adNode(client, slot, variant) {
  return el('div', { className: ['ad-slot', `ad-slot--${variant}`], 'data-ad-slot': slot }, [
    el('span', { className: ['ad-slot__label'] }, [txt('Advertisement')]),
    el(
      'ins',
      {
        className: ['adsbygoogle'],
        style: 'display:block',
        'data-ad-client': client,
        'data-ad-slot': slot,
        'data-ad-format': 'auto',
        'data-full-width-responsive': 'true',
      },
      []
    ),
  ]);
}

export default function rehypeAdSlots(options = {}) {
  const { client = '', slot = '' } = options;

  // 未配置就整体跳过，不留空壳节点
  if (!client || !slot || client.includes('XXXX')) return () => {};

  return (tree) => {
    if (!Array.isArray(tree.children)) return;

    // 顶级 H2 的位置（正文里的章节标题都在这一层）
    const h2 = [];
    tree.children.forEach((node, i) => {
      if (node.type === 'element' && node.tagName === 'h2') h2.push(i);
    });
    const n = h2.length;
    if (n === 0) return;

    // 短文章只在开头放一个，避免广告密度超过正文。
    // 文章普遍 9–14 个 H2（每节约 200–300 词），按 0 / 35% / 75% / 结尾分布，
    // 大约每 500–700 词一个广告位。
    const marks = [0];
    if (n >= 6) {
      const mid = Math.max(2, Math.round(n * 0.35));
      marks.push(mid);
      if (n >= 10) {
        const late = Math.max(mid + 1, Math.round(n * 0.75));
        if (late <= n - 1) marks.push(late);
      }
    }

    const before = new Map();
    for (const k of marks) {
      const at = h2[k];
      if (at === undefined) continue;
      before.set(at, adNode(client, slot, 'inline'));
    }

    const out = [];
    tree.children.forEach((node, i) => {
      if (before.has(i)) out.push(before.get(i));
      out.push(node);
    });
    // 末位：正好落在 FAQ 组件之前
    out.push(adNode(client, slot, 'inline'));

    tree.children = out;
  };
}
