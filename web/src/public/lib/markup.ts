// Tiny, safe inline markup used by the visual editor: [b]bold[/b] [i]italic[/i] [u]underline[/u]
// [a=https://x.y]link[/a]; newline = line break. Nothing here ever produces raw HTML.
export type Inline =
  | { t: "text"; v: string }
  | { t: "br" }
  | { t: "b" | "i" | "u"; c: Inline[] }
  | { t: "a"; href: string; c: Inline[] };

export function safeHref(raw: string): string | null {
  const v = raw.trim();
  if (/^(https?:\/\/|mailto:|tel:)[^\s"'<>]+$/i.test(v) || /^\/(?!\/)[^\s"'<>]*$/.test(v) || /^#[\w-]+$/.test(v)) return v;
  return null;
}

const TAG = /\[(\/?)(b|i|u)\]|\[a=([^\]\s]+)\]|\[\/a\]|\n/g;

export function parseInline(src: string): Inline[] {
  const root: Inline[] = [];
  const stack: { kind: string; node: { c: Inline[] } | null; out: Inline[] }[] = [{ kind: "", node: null, out: root }];
  const push = (n: Inline) => stack[stack.length - 1].out.push(n);
  let last = 0;
  for (const m of src.matchAll(TAG)) {
    if (m.index! > last) push({ t: "text", v: src.slice(last, m.index) });
    last = m.index! + m[0].length;
    if (m[0] === "\n") { push({ t: "br" }); continue; }
    if (m[0] === "[/a]") { if (stack.at(-1)!.kind === "a" && stack.length > 1) stack.pop(); else push({ t: "text", v: m[0] }); continue; }
    if (m[3] !== undefined) {
      const href = safeHref(m[3]);
      if (!href) { push({ t: "text", v: m[0] }); continue; }
      const node: Extract<Inline, { t: "a" }> = { t: "a", href, c: [] };
      push(node);
      stack.push({ kind: "a", node, out: node.c });
      continue;
    }
    const kind = m[2] as "b" | "i" | "u";
    if (m[1]) { // closing
      if (stack.at(-1)!.kind === kind && stack.length > 1) stack.pop(); else push({ t: "text", v: m[0] });
    } else {
      const node: Inline = { t: kind, c: [] };
      push(node);
      stack.push({ kind, node, out: node.c });
    }
  }
  if (last < src.length) push({ t: "text", v: src.slice(last) });
  return root;
}

/** Plain text (for alt text, <title>, aria labels): markup removed. */
export function stripMarkup(src: string): string {
  return src.replace(/\[a=[^\]\s]+\]|\[\/?(?:b|i|u|a)\]/g, "");
}

/** Browser DOM (contentEditable) -> markup. Anything not in the allowlist is flattened to its text. */
export function domToMarkup(root: Node): string {
  let out = "";
  const walk = (node: Node) => {
    if (node.nodeType === 3) { out += (node.nodeValue ?? "").replace(/ /g, " "); return; }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (tag === "br") { out += "\n"; return; }
    const wrap = (open: string, close: string) => { out += open; el.childNodes.forEach(walk); out += close; };
    if (tag === "b" || tag === "strong") return wrap("[b]", "[/b]");
    if (tag === "i" || tag === "em") return wrap("[i]", "[/i]");
    if (tag === "u") return wrap("[u]", "[/u]");
    if (tag === "a") {
      const href = safeHref(el.getAttribute("href") ?? "");
      return href ? wrap(`[a=${href}]`, "[/a]") : el.childNodes.forEach(walk);
    }
    if (tag === "div" || tag === "p") { // browsers wrap new lines in blocks
      if (out && !out.endsWith("\n")) out += "\n";
      el.childNodes.forEach(walk);
      return;
    }
    // a styled span (e.g. the browser keeps font styles when bold/italic is applied via CSS)
    const st = (el as HTMLElement).style;
    const bold = st?.fontWeight === "bold" || Number(st?.fontWeight) >= 600;
    const italic = st?.fontStyle === "italic";
    if (bold) out += "[b]";
    if (italic) out += "[i]";
    el.childNodes.forEach(walk);
    if (italic) out += "[/i]";
    if (bold) out += "[/b]";
  };
  root.childNodes.forEach(walk);
  return out.replace(/\n+$/g, "").replace(/\[(b|i|u)\]\[\/\1\]/g, "");
}
