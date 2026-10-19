/**
 * remark 插件：剥掉正文里的 FAQ 段落。
 *
 * 原因：每篇文章的 markdown 正文里都带一段 `## FAQ` + `**问题？** 答案` 的纯文本，
 * 而 FaqSection 组件又用 extractFaq 把同一批问答渲染成结构化区块，
 * 结果读者会连续看到两遍完全相同的问答（先 "<h2>FAQ</h2>"，紧接着
 * "<h2>Frequently Asked Questions</h2>"），154 篇全中。
 *
 * 这里在渲染阶段把 FAQ 标题及其后所有节点丢掉，问答只由组件输出一次，
 * 同时保证 FAQPage 结构化数据与可见内容一一对应（只保留一份）。
 *
 * 注意：只影响渲染结果，不影响 article.body，extractFaq 仍能从原文取到问答。
 */

function nodeText(node) {
  if (typeof node.value === 'string') return node.value;
  if (Array.isArray(node.children)) return node.children.map(nodeText).join('');
  return '';
}

export default function stripFaqSection() {
  return (tree) => {
    if (!Array.isArray(tree.children)) return;
    const idx = tree.children.findIndex(
      (node) =>
        node.type === 'heading' &&
        node.depth === 2 &&
        /^(?:faq|frequently asked questions)$/i.test(nodeText(node).trim())
    );
    // FAQ 是正文最后一段，命中即截到此处
    if (idx >= 0) tree.children.length = idx;
  };
}
