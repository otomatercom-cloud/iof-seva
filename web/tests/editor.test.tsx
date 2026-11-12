import { render } from "@testing-library/react";
import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/editor/login/route";
import { POST as save } from "@/app/api/editor/save/route";
import { Sections } from "@/public/components/sections/sections";
import { buildContent } from "@/public/lib/content";
import { cleanLayout, cleanStyle, orderSections } from "@/public/lib/editor-style";
import { domToMarkup, parseInline, safeHref, stripMarkup } from "@/public/lib/markup";
import { resetRateLimit } from "@/public/lib/rate-limit";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("markup", () => {
  it("parses bold/italic/underline/link/newline", () => {
    const html = renderToStaticMarkup(<>{buildContent({ texts: { k: "a [b]b[/b] [i]i[/i] [u]u[/u]\n[a=https://x.io]l[/a]" } }).e("k")}</>);
    expect(html).toBe('a <strong>b</strong> <em>i</em> <u>u</u><br/><a href="https://x.io" class="underline underline-offset-2" target="_blank" rel="noopener noreferrer">l</a>');
  });
  it("never produces HTML or unsafe links", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("//evil.com")).toBeNull();
    expect(safeHref("https://ok.com/a?b=1")).toBe("https://ok.com/a?b=1");
    const html = renderToStaticMarkup(<>{buildContent({ texts: { k: "<img src=x onerror=1>[a=javascript:x]t[/a]" } }).e("k")}</>);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("href=\"javascript");
  });
  it("tolerates unbalanced tags and strips for plain text", () => {
    expect(parseInline("[b]open")).toHaveLength(1);
    expect(stripMarkup("[b]x[/b] [a=https://a.b]y[/a]")).toBe("x y");
  });
  it("serialises editor DOM back to markup", () => {
    const d = document.createElement("div");
    d.innerHTML = 'one <b>two</b><div>three <a href="https://a.b">l</a></div><a href="javascript:x">bad</a>';
    expect(domToMarkup(d)).toBe("one [b]two[/b]\nthree [a=https://a.b]l[/a]bad");
  });
});

describe("style + layout allowlists", () => {
  it("drops unknown values", () => {
    expect(cleanStyle({ align: "center", size: "md", color: "red", x: 1 })).toEqual({ align: "center" });
    expect(cleanLayout({ order: ["a", 3], hidden: ["b"], sections: { a: { bg: "soft", space: "huge" } } }))
      .toEqual({ order: ["a"], hidden: ["b"], sections: { a: { bg: "soft" } } });
  });
  it("orders by saved layout and keeps new sections", () => {
    const defs = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(orderSections(defs, { order: ["c", "a", "zzz"], hidden: [], sections: {} }).map((d) => d.id)).toEqual(["c", "a", "b"]);
  });
});

describe("Sections", () => {
  const data = { layouts: { p: { order: ["b", "a"], hidden: ["a"], sections: { b: { bg: "soft" } } } } };
  const defs = [{ id: "a", node: <i>A</i> }, { id: "b", node: <i>B</i> }];
  it("public: applies order, drops hidden sections from the HTML", () => {
    const html = renderToStaticMarkup(<Sections page="p" c={buildContent(data)} defs={defs} />);
    expect(html).toBe('<div class="sb-soft"><i>B</i></div>');
  });
  it("editor: keeps hidden sections, flagged", () => {
    const { container } = render(<Sections page="p" c={buildContent(data, "", true)} defs={defs} />);
    expect(Array.from(container.querySelectorAll("[data-sec]")).map((e) => `${e.getAttribute("data-sec")}:${e.getAttribute("data-hidden")}`)).toEqual(["b:0", "a:1"]);
  });
  it("styled text gets classes publicly, plain text stays plain", () => {
    const c = buildContent({ texts: { a: "Hi" }, styles: { a: { align: "center", color: "navy" } } });
    expect(renderToStaticMarkup(<>{c.e("a")}</>)).toBe('<span class="te-center tc-navy">Hi</span>');
    expect(renderToStaticMarkup(<>{buildContent({ texts: { a: "Hi" } }).e("a")}</>)).toBe("Hi");
  });
});

describe("editor API routes", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const post = (url: string, payload: unknown, headers: Record<string, string> = {}) =>
    new NextRequest(`http://localhost:3000${url}`, { method: "POST", body: JSON.stringify(payload),
      headers: { "content-type": "application/json", origin: "http://localhost:3000", host: "localhost:3000", "x-real-ip": "2.2.2.2", ...headers } });
  beforeEach(() => {
    resetRateLimit();
    process.env.ODOO_BASE_URL = "https://odoo.example"; process.env.ODOO_DATABASE = "db1";
    fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("login sets an httpOnly cookie and never forwards/logs the password elsewhere", async () => {
    const sid = "x".repeat(40);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: { uid: 7 } }), { headers: { "set-cookie": `session_id=${sid}; Path=/; HttpOnly` } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, name: "E" }), { status: 200 }));
    const res = await login(post("/api/editor/login", { login: "e@x.io", password: "pw" }));
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`iof_editor=${sid}`); expect(cookie.toLowerCase()).toContain("httponly"); expect(cookie.toLowerCase()).toContain("samesite=strict");
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://odoo.example/web/session/authenticate");
    expect(fetchMock.mock.calls[1][1].headers["X-IOF-Editor"]).toBe("1");
  });
  it("login: wrong password 401, non-editor 403, cross-origin 403, rate limited", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ result: { uid: false } })));
    expect((await login(post("/api/editor/login", { login: "a", password: "b" }))).status).toBe(401);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ result: { uid: 3 } }), { headers: { "set-cookie": `session_id=${"y".repeat(40)}` } }))
      .mockResolvedValueOnce(new Response("{}", { status: 403 }));
    expect((await login(post("/api/editor/login", { login: "a", password: "b" }))).status).toBe(403);
    expect((await login(post("/api/editor/login", { login: "a", password: "b" }, { origin: "https://evil.example" }))).status).toBe(403);
    resetRateLimit();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ result: { uid: false } })));
    for (let i = 0; i < 8; i++) await login(post("/api/editor/login", { login: "a", password: "b" }));
    expect((await login(post("/api/editor/login", { login: "a", password: "b" }))).status).toBe(429);
  });
  it("save needs the cookie + same origin and forwards with the Odoo session", async () => {
    expect((await save(post("/api/editor/save", {}))).status).toBe(401);
    expect((await save(post("/api/editor/save", {}, { cookie: "iof_editor=abc", origin: "https://evil.example" }))).status).toBe(403);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true, saved: 1 }), { status: 200 }));
    const res = await save(post("/api/editor/save", { texts: { k: { value: "v" } } }, { cookie: "iof_editor=abc" }));
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://odoo.example/api/iof/editor/save");
    expect(init.headers.Cookie).toBe("session_id=abc");
  });
});
