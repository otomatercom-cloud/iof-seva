"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ALIGN, COLOR, SECTION_BG, SECTION_SPACE, SIZE, textClass, type TextStyle } from "@/public/lib/editor-style";
import { domToMarkup } from "@/public/lib/markup";

type Dirty = { texts: Map<string, { value?: string; style?: TextStyle }>; items: Map<string, string>; layout: boolean };

const parse = <T,>(s: string | null | undefined, fb: T): T => { try { return s ? (JSON.parse(s) as T) : fb; } catch { return fb; } };
const STYLE_CLASS = /\b(te|ts|tc)-\w+\b/g;

/** Visual editor: click any text to edit, floating toolbar for format/align/size/colour, section controls, photo replace. */
export function EditorShell({ user, page, children }: { user: string; page: string; children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<{ key: string; value: string } | null>(null);
  const dirty = useRef<Dirty>({ texts: new Map(), items: new Map(), layout: false });
  const toolRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const active = useRef<HTMLElement | null>(null);
  const savedRange = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [isItem, setIsItem] = useState(false);

  const bump = () => setCount(dirty.current.texts.size + dirty.current.items.size + (dirty.current.layout ? 1 : 0));
  const markEl = (el: HTMLElement) => {
    const k = el.dataset.ek, it = el.dataset.eit;
    if (k) { const cur = dirty.current.texts.get(k) ?? {}; cur.value = ""; cur.style = parse(el.dataset.es, {}); dirty.current.texts.set(k, cur); }
    if (it) dirty.current.items.set(it, "");
    bump();
  };

  useEffect(() => {
    const body = document.body;
    body.classList.add("ed-on");
    const editables = () => Array.from(document.querySelectorAll<HTMLElement>("[data-ek],[data-eit]"));
    editables().forEach((el) => { el.contentEditable = "true"; el.spellcheck = true; });

    const showTool = (el: HTMLElement) => {
      const t = toolRef.current; if (!t) return;
      active.current = el; setIsItem(!!el.dataset.eit);
      const r = el.getBoundingClientRect();
      t.style.display = "flex";
      t.style.top = `${Math.max(60, r.top + window.scrollY - t.offsetHeight - 8)}px`;
      t.style.left = `${Math.max(8, Math.min(r.left + window.scrollX, window.innerWidth - 430))}px`;
    };
    const onFocusIn = (e: FocusEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("[data-ek],[data-eit]") as HTMLElement | null;
      if (el) showTool(el);
    };
    const onFocusOut = (e: FocusEvent) => {
      const to = e.relatedTarget as HTMLElement | null;
      if (to && toolRef.current?.contains(to)) return;
      setTimeout(() => { if (!toolRef.current?.contains(document.activeElement) && !(document.activeElement as HTMLElement)?.closest?.("[data-ek],[data-eit]")) { if (toolRef.current) toolRef.current.style.display = "none"; setLinkOpen(false); } }, 150);
    };
    const onSel = () => {
      const s = window.getSelection();
      if (s && s.rangeCount && active.current?.contains(s.anchorNode)) savedRange.current = s.getRangeAt(0).cloneRange();
    };
    const onInput = (e: Event) => {
      const el = (e.target as HTMLElement).closest?.("[data-ek],[data-eit]") as HTMLElement | null;
      if (!el) return;
      markEl(el);
      // same key shown in several places (e.g. "Join" button): keep them in step
      const k = el.dataset.ek;
      if (k) document.querySelectorAll<HTMLElement>(`[data-ek="${CSS.escape(k)}"]`).forEach((o) => { if (o !== el) o.innerHTML = el.innerHTML; });
    };
    const onKey = (e: KeyboardEvent) => {
      const el = (e.target as HTMLElement).closest?.("[data-ek],[data-eit]") as HTMLElement | null;
      if (!el) return;
      if (e.key === "Enter") { e.preventDefault(); document.execCommand("insertLineBreak"); }
      if (el.dataset.eit && (e.ctrlKey || e.metaKey) && /^[biu]$/i.test(e.key)) e.preventDefault();
    };
    const onPaste = (e: ClipboardEvent) => {
      if (!(e.target as HTMLElement).closest?.("[data-ek],[data-eit]")) return;
      e.preventDefault();
      document.execCommand("insertText", false, e.clipboardData?.getData("text/plain") ?? "");
    };
    // links/buttons/forms must not navigate while editing
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest(".ed-bar,.ed-tool,.ed-sec,.ed-over,.ed-modal")) return;
      if (t.closest("a[href], button[type=submit]")) e.preventDefault();
    };
    const onSubmit = (e: Event) => e.preventDefault();
    document.addEventListener("focusin", onFocusIn); document.addEventListener("focusout", onFocusOut);
    document.addEventListener("selectionchange", onSel); document.addEventListener("input", onInput);
    document.addEventListener("keydown", onKey); document.addEventListener("paste", onPaste);
    document.addEventListener("click", onClick, true); document.addEventListener("submit", onSubmit, true);

    // ---- section controls
    const secs = () => Array.from(document.querySelectorAll<HTMLElement>("[data-sec]"));
    const applySecStyle = (s: HTMLElement) => {
      const st = parse<{ bg?: string; space?: string }>(s.dataset.ss, {});
      s.className = s.className.replace(/\b(sb|sp)-\w+\b/g, "").trim();
      if (st.bg) s.classList.add(`sb-${st.bg}`);
      if (st.space) s.classList.add(`sp-${st.space}`);
    };
    const mkBtn = (label: string, title: string, fn: () => void) => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.title = title; b.onclick = fn; return b;
    };
    const mkSel = (title: string, opts: readonly string[], get: () => string, set: (v: string) => void) => {
      const s = document.createElement("select"); s.title = title;
      opts.forEach((o) => { const op = document.createElement("option"); op.value = o; op.textContent = `${title}: ${o}`; s.appendChild(op); });
      s.value = get(); s.onchange = () => set(s.value); return s;
    };
    const touchLayout = () => { dirty.current.layout = true; bump(); };
    secs().forEach((s) => {
      const bar = document.createElement("div"); bar.className = "ed-sec"; bar.contentEditable = "false";
      const hideBtn = mkBtn(s.dataset.hidden === "1" ? "Show" : "Hide", "Hide or show on the public site", () => {
        const h = s.dataset.hidden === "1" ? "0" : "1"; s.dataset.hidden = h; hideBtn.textContent = h === "1" ? "Show" : "Hide"; touchLayout();
      });
      const name = document.createElement("span"); name.textContent = s.dataset.label ?? "Section"; name.style.padding = "0 6px";
      bar.append(name,
        mkBtn("↑", "Move up", () => { const p = s.previousElementSibling; if (p && (p as HTMLElement).dataset.sec) { s.parentElement!.insertBefore(s, p); touchLayout(); s.scrollIntoView({ block: "nearest" }); } }),
        mkBtn("↓", "Move down", () => { const n = s.nextElementSibling; if (n && (n as HTMLElement).dataset.sec) { s.parentElement!.insertBefore(n, s); touchLayout(); s.scrollIntoView({ block: "nearest" }); } }),
        hideBtn,
      );
      const upd = (k: "bg" | "space", v: string) => { const st = parse<Record<string, string>>(s.dataset.ss, {}); if (v === "none") delete st[k]; else st[k] = v; s.dataset.ss = JSON.stringify(st); applySecStyle(s); touchLayout(); };
      const cur = parse<Record<string, string>>(s.dataset.ss, {});
      bar.append(mkSel("Space", SECTION_SPACE, () => cur.space ?? "none", (v) => upd("space", v)));
      if (s.dataset.dark !== "1") bar.append(mkSel("Background", SECTION_BG, () => cur.bg ?? "none", (v) => upd("bg", v)));
      bar.onclick = (e) => e.stopPropagation();
      s.prepend(bar);
    });
    // ---- photo / long text overlays
    document.querySelectorAll<HTMLElement>("[data-ei]").forEach((el) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "ed-over"; b.textContent = "Change photo";
      b.onclick = () => {
        const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/png,image/jpeg,image/webp";
        inp.onchange = async () => {
          const f = inp.files?.[0]; if (!f) return;
          if (f.size > 7 * 1024 * 1024) { setMsg("Photo too large (max 7 MB)."); return; }
          const data = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] ?? ""); r.readAsDataURL(f); });
          setMsg("Uploading photo…");
          const r = await fetch("/api/editor/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: el.dataset.ei, data }) });
          if (r.ok) window.location.reload(); else setMsg("Photo upload failed.");
        };
        inp.click();
      };
      el.appendChild(b);
    });
    document.querySelectorAll<HTMLElement>("[data-elong]").forEach((el) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "ed-over"; b.textContent = "Edit this text";
      b.style.position = "sticky"; b.style.float = "right";
      b.onclick = () => setModal({ key: el.dataset.elong!, value: el.dataset.value ?? "" });
      el.prepend(b);
    });

    const warn = (e: BeforeUnloadEvent) => { const d = dirty.current; if (d.texts.size || d.items.size || d.layout) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => {
      body.classList.remove("ed-on");
      document.removeEventListener("focusin", onFocusIn); document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("selectionchange", onSel); document.removeEventListener("input", onInput);
      document.removeEventListener("keydown", onKey); document.removeEventListener("paste", onPaste);
      document.removeEventListener("click", onClick, true); document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("beforeunload", warn);
    };
  }, []);

  // ---- toolbar actions
  const restore = () => {
    const el = active.current; if (!el) return;
    el.focus();
    const s = window.getSelection();
    if (s && savedRange.current) { s.removeAllRanges(); s.addRange(savedRange.current); }
  };
  const cmd = (c: string) => { restore(); document.execCommand(c); if (active.current) { markEl(active.current); active.current.dispatchEvent(new Event("input", { bubbles: true })); } };
  const setStyle = (patch: Partial<TextStyle>) => {
    const el = active.current; if (!el?.dataset.ek) return;
    const st: TextStyle = { ...parse<TextStyle>(el.dataset.es, {}), ...patch };
    (Object.keys(st) as (keyof TextStyle)[]).forEach((k) => { if (!st[k] || st[k] === "md") delete st[k]; });
    document.querySelectorAll<HTMLElement>(`[data-ek="${CSS.escape(el.dataset.ek)}"]`).forEach((o) => {
      o.dataset.es = JSON.stringify(st);
      o.className = `${o.className.replace(STYLE_CLASS, "")} ${textClass(st)}`.trim();
    });
    markEl(el);
  };
  const applyLink = () => {
    const url = linkRef.current?.value.trim() ?? "";
    restore();
    if (!url) document.execCommand("unlink");
    else document.execCommand("createLink", false, /^(https?:|mailto:|tel:|\/|#)/i.test(url) ? url : `https://${url}`);
    setLinkOpen(false);
    if (active.current) { markEl(active.current); active.current.dispatchEvent(new Event("input", { bubbles: true })); }
  };

  async function save() {
    const d = dirty.current;
    const texts: Record<string, { value?: string; style?: string }> = {};
    document.querySelectorAll<HTMLElement>("[data-ek]").forEach((el) => {
      const k = el.dataset.ek!; const t = d.texts.get(k); if (!t || texts[k]) return;
      texts[k] = { value: domToMarkup(el), style: JSON.stringify(parse<TextStyle>(el.dataset.es, {})) };
    });
    d.texts.forEach((t, k) => { if (!texts[k] && t.value) texts[k] = { value: t.value }; });
    const items: Record<string, { title?: string; text?: string }> = {};
    document.querySelectorAll<HTMLElement>("[data-eit]").forEach((el) => {
      const [id, field] = el.dataset.eit!.split(":"); if (!d.items.has(el.dataset.eit!)) return;
      (items[id] ??= {})[field as "title" | "text"] = el.innerText.replace(/ /g, " ").trim();
    });
    const layouts: Record<string, unknown> = {};
    if (d.layout) {
      const ss = Array.from(document.querySelectorAll<HTMLElement>("[data-sec]"));
      const sections: Record<string, unknown> = {};
      ss.forEach((s) => { sections[s.dataset.sec!] = parse(s.dataset.ss, {}); });
      layouts[page] = { order: ss.map((s) => s.dataset.sec), hidden: ss.filter((s) => s.dataset.hidden === "1").map((s) => s.dataset.sec), sections };
    }
    setBusy(true); setMsg("Saving…");
    try {
      const res = await fetch("/api/editor/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texts, items, layouts }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        dirty.current = { texts: new Map(), items: new Map(), layout: false }; setCount(0);
        window.location.reload(); return;
      }
      if (res.status === 401 || res.status === 403) setMsg("Session expired. Please sign in again.");
      else setMsg(data.message ? `Not saved: ${data.message}` : "Not saved. Please try again.");
    } catch { setMsg("Network error. Not saved."); }
    setBusy(false);
  }
  async function exit() {
    if (count && !window.confirm("Leave without saving your changes?")) return;
    dirty.current = { texts: new Map(), items: new Map(), layout: false };
    await fetch("/api/editor/logout", { method: "POST" }).catch(() => {});
    window.location.assign("/");
  }
  function saveLong() {
    if (!modal) return;
    dirty.current.texts.set(modal.key, { value: modal.value });
    const el = document.querySelector<HTMLElement>(`[data-elong="${CSS.escape(modal.key)}"]`); if (el) el.dataset.value = modal.value;
    setModal(null); bump(); setMsg("Text changed. Press Save to publish.");
  }
  const btn = (on?: boolean) => (on ? "on" : undefined);
  return (
    <>
      <div className="ed-bar" role="toolbar" aria-label="Editor">
        <span>Editing · {page}</span><span className="msg">{msg || (count ? `${count} unsaved change${count > 1 ? "s" : ""}` : `Signed in as ${user}`)}</span>
        <span className="grow" />
        <a href="/" onClick={(e) => { if (count && !window.confirm("Discard unsaved changes?")) e.preventDefault(); }}>Discard & reload</a>
        <button type="button" onClick={exit}>Exit editor</button>
        <button type="button" className="primary" onClick={save} disabled={busy || !count}>Save</button>
      </div>
      <div ref={toolRef} className="ed-tool" onMouseDown={(e) => { if (!(e.target as HTMLElement).closest("input")) e.preventDefault(); }}>
        {!isItem && <>
          <button type="button" title="Bold" onClick={() => cmd("bold")}><b>B</b></button>
          <button type="button" title="Italic" onClick={() => cmd("italic")}><i>I</i></button>
          <button type="button" title="Underline" onClick={() => cmd("underline")}><u>U</u></button>
          <button type="button" title="Link" className={btn(linkOpen)} onClick={() => { setLinkOpen((v) => !v); setTimeout(() => linkRef.current?.focus(), 0); }}>🔗</button>
          <span className="sep" />
          {ALIGN.map((a) => <button key={a} type="button" title={`Align ${a}`} onClick={() => setStyle({ align: a })}>{{ left: "⇤", center: "↔", right: "⇥", justify: "☰" }[a]}</button>)}
          <span className="sep" />
          <select title="Size" defaultValue="md" onChange={(e) => setStyle({ size: e.target.value as TextStyle["size"] })}>
            {SIZE.map((s) => <option key={s} value={s}>Size {s.toUpperCase()}</option>)}
          </select>
          {COLOR.map((c) => <button key={c} type="button" title={c} className="sw" style={{ background: { navy: "#0b2545", orange: "#d24e0a", green: "#15803d", slate: "#475569", white: "#fff" }[c] }} onClick={() => setStyle({ color: c })} />)}
          <button type="button" title="Reset look" onClick={() => { setStyle({ align: undefined, size: undefined, color: undefined }); cmd("removeFormat"); }}>✕</button>
          {linkOpen && <div style={{ width: "100%", display: "flex", gap: 4 }}>
            <input ref={linkRef} placeholder="https://… (empty = remove link)" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } }} />
            <button type="button" onClick={applyLink}>Apply</button></div>}
        </>}
        {isItem && <span style={{ padding: "0 6px" }}>Plain text (card / list item)</span>}
      </div>
      {children}
      {modal && (
        <div className="ed-modal" role="dialog" aria-modal="true" aria-label="Edit long text">
          <div>
            <b>Edit text — “## Heading”, “- bullet”, blank line = new paragraph, {"{email}"} = contact email</b>
            <textarea value={modal.value} onChange={(e) => setModal({ ...modal, value: e.target.value })} />
            <div className="row"><button type="button" onClick={() => setModal(null)}>Cancel</button><button type="button" className="primary" onClick={saveLong}>Use this text</button></div>
          </div>
        </div>
      )}
    </>
  );
}
