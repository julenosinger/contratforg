/* Safe Markdown-to-DOM renderer for the AI chat. No library, no innerHTML: every node is built with
   createElement / createTextNode, so nothing an assistant (or a tampered history) returns can ever become markup.
   Supported: paragraphs, headings (rendered as bold), bullet and numbered lists, blockquotes, inline `code`,
   **bold**, *italic*, fenced code blocks with a language label, and [links](http(s)) with
   rel="noopener noreferrer" target="_blank". Anything else is literal text. Huge inputs are truncated and inline
   nesting is bounded, so a giant message cannot freeze the page. */
(function () {
  'use strict';
  const MAX_LENGTH = 200000;       // above this the input is truncated (the proxy caps a message at 20000 anyway)
  const MAX_INLINE_DEPTH = 8;      // bold/italic nesting bound
  const LINK_RE = /^https?:\/\//i;

  /* Inline markdown -> array of nodes. Never uses innerHTML. */
  function inlineNodes(text, doc, depth) {
    const out = [];
    if (depth > MAX_INLINE_DEPTH) { out.push(doc.createTextNode(text)); return out; }
    let i = 0;
    while (i < text.length) {
      const rest = text.slice(i);
      let m;
      if (rest[0] === '`') {                                   // `code`
        const end = rest.indexOf('`', 1);
        if (end < 0) { out.push(doc.createTextNode(rest)); break; }
        const el = doc.createElement('code');
        el.textContent = rest.slice(1, end);
        out.push(el);
        i += end + 1; continue;
      }
      m = rest.match(/^\*\*([^*]+)\*\*/);                       // **bold**
      if (m) {
        const el = doc.createElement('strong');
        inlineNodes(m[1], doc, depth + 1).forEach((n) => el.appendChild(n));
        out.push(el); i += m[0].length; continue;
      }
      m = rest.match(/^\*([^*]+)\*/);                           // *italic*
      if (m) {
        const el = doc.createElement('em');
        inlineNodes(m[1], doc, depth + 1).forEach((n) => el.appendChild(n));
        out.push(el); i += m[0].length; continue;
      }
      m = rest.match(/^\[([^\]]+)\]\(([^)\s]+)\)/);             // [text](url)
      if (m) {
        if (LINK_RE.test(m[2])) {
          const a = doc.createElement('a');
          a.textContent = m[1]; a.href = m[2]; a.rel = 'noopener noreferrer'; a.target = '_blank';
          out.push(a);
        } else { out.push(doc.createTextNode(m[0])); }          // not http(s): literal text
        i += m[0].length; continue;
      }
      out.push(doc.createTextNode(rest[0])); i++;
    }
    return out;
  }

  function paragraph(text, doc) {
    const p = doc.createElement('p');
    inlineNodes(text, doc, 0).forEach((n) => p.appendChild(n));
    return p;
  }

  /* A fenced code block. The UI layer (app.js) adds the header and the buttons; this only builds the code element. */
  function codeBlock(code, lang, doc) {
    const wrap = doc.createElement('div');
    wrap.className = 'ai-code-block';
    if (lang) wrap.setAttribute('data-lang', lang);
    const pre = doc.createElement('pre');
    pre.className = 'ai-code';
    const codeEl = doc.createElement('code');
    codeEl.textContent = code;
    pre.appendChild(codeEl);
    wrap.appendChild(pre);
    return wrap;
  }

  const isFence = (l) => /^\s*```/.test(l);
  const isHeading = (l) => /^\s*#{1,6}\s+/.test(l);
  const isList = (l) => /^\s*(?:[-*]\s+|\d+[.)]\s+)/.test(l);
  const isQuote = (l) => /^\s*>\s?/.test(l);
  const isBlank = (l) => l.trim() === '';

  function renderMarkdown(text, doc) {
    const root = doc.createDocumentFragment();
    if (typeof text !== 'string') return root;
    if (text.length > MAX_LENGTH) text = text.slice(0, MAX_LENGTH);
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (isBlank(line)) { i++; continue; }
      const fence = line.match(/^\s*```\s*([A-Za-z0-9_+#.-]*)\s*$/);
      if (fence) {
        const lang = fence[1];
        const buf = [];
        i++;
        while (i < lines.length && !isFence(lines[i])) { buf.push(lines[i]); i++; }
        if (i < lines.length) i++;                       // consume the closing fence (if any)
        root.appendChild(codeBlock(buf.join('\n'), lang, doc));
        continue;
      }
      if (isQuote(line)) {
        const buf = [];
        while (i < lines.length && isQuote(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        const bq = doc.createElement('blockquote');
        bq.appendChild(paragraph(buf.join(' '), doc));
        root.appendChild(bq);
        continue;
      }
      const head = line.match(/^\s*#{1,6}\s+(.+?)\s*$/);
      if (head) {
        const p = doc.createElement('p');
        p.className = 'chat-heading';
        const b = doc.createElement('strong');
        inlineNodes(head[1], doc, 0).forEach((n) => b.appendChild(n));
        p.appendChild(b);
        root.appendChild(p);
        i++; continue;
      }
      if (isList(line)) {
        const ul = doc.createElement('ul');
        while (i < lines.length && isList(lines[i])) {
          const lm = lines[i].match(/^\s*(?:[-*]\s+|\d+[.)]\s+)(.+)$/);
          if (!lm) break;
          const li = doc.createElement('li');
          inlineNodes(lm[1], doc, 0).forEach((n) => li.appendChild(n));
          ul.appendChild(li); i++;
        }
        root.appendChild(ul);
        continue;
      }
      // paragraph: collect until a blank line or a new block
      const buf = [line]; i++;
      while (i < lines.length && !isBlank(lines[i]) && !isFence(lines[i]) && !isHeading(lines[i]) && !isList(lines[i]) && !isQuote(lines[i])) { buf.push(lines[i]); i++; }
      root.appendChild(paragraph(buf.join(' '), doc));
    }
    return root;
  }

  window.renderChatMarkdown = function (text) {
    try { return renderMarkdown(String(text == null ? '' : text), document); }
    catch (_) { const f = document.createDocumentFragment(); f.appendChild(document.createTextNode(String(text == null ? '' : text))); return f; }
  };
})();
