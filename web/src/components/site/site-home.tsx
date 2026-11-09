"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IofLogo } from "@/components/common/logo";
import { useSiteStore, loadSite } from "@/lib/site-cms";
import { SERVICES as SERVICE_ICONS } from "./site-content";

const GRAD = ["150deg,#f7b866,#f39a32", "150deg,#138a50,#0b6a3f", "150deg,#f3c46a,#d9822b", "150deg,#4fb286,#138a50", "150deg,#f7b866,#c85a1f", "150deg,#075b38,#138a50"];
const bgOf = (img: string, i: number) => (img ? `linear-gradient(rgba(7,40,25,.15),rgba(7,40,25,.15)), url(${img}) center/cover` : `linear-gradient(${GRAD[i % GRAD.length]})`);

const NAV = [["#home", "Home"], ["#about", "About"], ["#services", "Seva"], ["#causes", "Cases"], ["#provinces", "Provinces"], ["#process", "How it works"], ["#faq", "FAQ"], ["#contact", "Contact"]] as const;
const heroBg = (img: string) => `linear-gradient(90deg,rgba(5,45,28,.88),rgba(5,45,28,.45)), url(${img}) center/cover`;

const HERO_ICON: Record<string, React.ReactNode> = {
  scale: <svg className="heart" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M5 21h14M5 7h14M5 7l-3 7a4 4 0 006 0zM19 7l-3 7a4 4 0 006 0z" /></svg>,
  cross: <svg className="heart" viewBox="0 0 24 24" fill="#fff"><path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" /></svg>,
  home: <svg className="heart" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6" /></svg>,
};

function useReveal() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
    document.querySelectorAll(".site .rv").forEach((el) => io.observe(el));
    return () => { io.disconnect(); document.documentElement.style.scrollBehavior = ""; };
  }, []);
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const st = performance.now();
      const f = (n: number) => { const p = Math.min((n - st) / 1600, 1); setV(Math.floor(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    }, { threshold: 0.4 });
    io.observe(el); return () => io.disconnect();
  }, [to]);
  return <h3 ref={ref}>{v}{suffix}</h3>;
}

export function SiteHome() {
  useReveal();
  const C = useSiteStore((x) => x.content);
  useEffect(() => { void loadSite(); }, []);
  const HERO = C.hero, CONTACT = C.contact, H = C.headings;
  const [stuck, setStuck] = useState(false);
  const [top, setTop] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#home");
  const [slide, setSlide] = useState(0);
  const [t, setT] = useState(0);
  const [faq, setFaq] = useState(0);
  const cur = HERO.length ? slide % HERO.length : 0;
  const np = C.principles.length || 1;

  useEffect(() => {
    const onScroll = () => {
      setStuck(scrollY > 60); setTop(scrollY > 600);
      let c = "#home";
      NAV.forEach(([h]) => { const el = document.querySelector(h); if (el && el.getBoundingClientRect().top < 200) c = h; });
      setActive(c);
    };
    onScroll(); addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { if (HERO.length < 2) return; const id = setInterval(() => setSlide((s) => (s + 1) % HERO.length), Math.max(3, C.heroSeconds) * 1000); return () => clearInterval(id); }, [slide, HERO.length, C.heroSeconds]);
  useEffect(() => { const id = setInterval(() => setT((s) => (s + 1) % np), 7500); return () => clearInterval(id); }, [t, np]);

  const Head = ({ k, center = true }: { k: keyof typeof H; center?: boolean }) => <><span className="eyebrow">{H[k].eyebrow}</span><h2 className="sec-title">{H[k].title}</h2></>;

  return (
    <>
      <div className="topbar"><div className="container">
        <div className="info"><span><b>Serving:</b> {CONTACT.address}</span><span><b>Call:</b> {CONTACT.phone}</span></div>
        <div><b>Email:</b> {CONTACT.email}</div>
      </div></div>

      <header className={stuck ? "stuck" : ""}><div className="container nav">
        <a href="#home" aria-label="India Overseas Forum – home" className="logo-chip"><IofLogo width={170} /></a>
        <nav className={`menu ${open ? "open" : ""}`} aria-label="Primary">
          {NAV.map(([h, l]) => <a key={h} href={h} className={active === h ? "active" : ""} onClick={() => setOpen(false)}>{l}</a>)}
        </nav>
        <Link href="/login" className="btn btn-primary">Seva Portal Login <span className="arr">→</span></Link>
        <button className={`burger ${open ? "open" : ""}`} aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><span /></button>
      </div></header>

      {/* HERO */}
      <section className="hero" id="home">
        {HERO.map((s, i) => (
          <div key={s.id} className={`slide ${cur === i ? "active" : ""}`} aria-hidden={cur !== i}>
            <div className={`bg bg${(i % 3) + 1}`} style={s.image ? { background: heroBg(s.image) } : undefined} />
            <div className="container" style={s.image ? { gridTemplateColumns: "1fr" } : undefined}>
              <div>
                <span className="eyebrow anim a1" style={{ color: "var(--orange-2)" }}>{s.eyebrow}</span>
                <h1 className="anim a2">{s.title}</h1>
                <p className="anim a3">{s.text}</p>
                <div className="btns anim a4">{s.ctaLabel && <a href={s.ctaHref || "#contact"} className="btn btn-primary">{s.ctaLabel} <span className="arr">→</span></a>}{s.altLabel && <a href={s.altHref || "#about"} className="btn btn-outline">{s.altLabel}</a>}</div>
              </div>
              {!s.image && <div className="hero-art"><div className="blob b1" /><div className="blob b2" /><div className="blob b3" />{HERO_ICON[s.icon]}</div>}
            </div>
          </div>
        ))}
        {HERO.length > 1 && <div className="hero-nav">{HERO.map((_, i) => <button key={i} className={cur === i ? "on" : ""} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />)}</div>}
      </section>

      {/* ABOUT */}
      <section className="about" id="about"><div className="container grid">
        <div className="about-media rv l">
          <div className="img i1"><svg viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice"><circle cx="300" cy="90" r="60" fill="#ffffff22" /><circle cx="110" cy="330" r="110" fill="#ffffff14" /><g fill="#fff" opacity=".9"><circle cx="150" cy="190" r="34" /><path d="M90 330c0-50 26-80 60-80s60 30 60 80z" /><circle cx="260" cy="215" r="24" opacity=".7" /><path d="M215 330c0-36 18-58 45-58s45 22 45 58z" opacity=".7" /></g></svg></div>
          <div className="img i2"><svg viewBox="0 0 300 260" preserveAspectRatio="xMidYMid slice"><circle cx="220" cy="60" r="50" fill="#ffffff33" /><path d="M150 205s-52-32-66-64c-11-24 3-50 28-50 15 0 27 8 38 22 11-14 23-22 38-22 25 0 39 26 28 50-14 32-66 64-66 64z" fill="#fff" /></svg></div>
          <div className="badge"><strong>{C.about.badgeNumber}</strong>{C.about.badgeText}</div>
        </div>
        <div className="rv r">
          <span className="eyebrow">{C.about.eyebrow}</span>
          <h2 className="sec-title">{C.about.title}</h2>
          <p className="lead">{C.about.lead}</p>
          <div className="feat">{C.about.features.map((f, i) => <div key={i}><div className="ico"><svg viewBox="0 0 24 24"><path d={i % 2 ? "M3 11l9-8 9 8M5 10v10h14V10" : "M12 21s-8-5-8-11a4.500 4.500 0 018-2.800A4.500 4.500 0 0120 10c0 6-8 11-8 11z"} /></svg></div><h4>{f.t}</h4><p>{f.d}</p></div>)}</div>
          {C.about.buttonLabel && <a href="#process" className="btn btn-dark">{C.about.buttonLabel} <span className="arr">→</span></a>}
        </div>
      </div></section>

      {/* SERVICES */}
      <section className="services" id="services"><div className="container">
        <div className="sec-head center rv"><Head k="services" /></div>
        <div className="cards3">
          {C.services.map((s, i) => (
            <div key={i} className={`svc rv d${(i % 3) + 1}`}><span className="num">{String(i + 1).padStart(2, "0")}</span><div className="ico"><svg viewBox="0 0 24 24"><path d={SERVICE_ICONS[i % SERVICE_ICONS.length].icon} /></svg></div><h3>{s.t}</h3><p>{s.d}</p><a href="#contact">Ask for help →</a></div>
          ))}
        </div>
      </div></section>

      {/* CAUSES */}
      <section id="causes"><div className="container">
        <div className="sec-head rv"><div><Head k="causes" /></div><Link href="/report" className="btn btn-dark">Report a case <span className="arr">→</span></Link></div>
        <div className="don-grid">
          {C.causes.map((c, i) => (
            <article key={i} className={`don rv ${i % 2 ? "r" : "l"} d${(i >> 1) + 1}`}><div className="thumb"><div className="art" style={{ background: bgOf(c.image, i) }} /></div>
              <div className="body"><h3>{c.t}</h3><p>{c.p}</p><a href="#contact" className="btn btn-primary">Get help</a></div></article>
          ))}
        </div>
      </div></section>

      {/* PROVINCES */}
      <section className="projects" id="provinces"><div className="container">
        <div className="sec-head center rv"><Head k="provinces" /></div>
        <div className="proj-grid">
          {C.provinces.map((p, i) => (
            <div key={i} className={`proj rv z d${(i % 3) + 1}`}><div className="art" style={{ background: bgOf(p.image, i) }} /><div className="cap"><h3>{p.t}</h3><span>{p.s}</span><a className="go" href="#contact">Contact this committee →</a></div></div>
          ))}
        </div>
      </div></section>

      {/* PROCESS */}
      <section id="process"><div className="container">
        <div className="sec-head center rv"><Head k="process" /></div>
        <div className="cards4">
          {C.steps.map((s, i) => <div key={i} className={`svc rv d${(i % 4) + 1}`}><span className="num">{String(i + 1).padStart(2, "0")}</span><h3>{s.t}</h3><p>{s.d}</p></div>)}
        </div>
      </div></section>

      {/* PRINCIPLES */}
      <section className="testi"><div className="container grid">
        <div className="rv l"><Head k="commitments" />
          <div className="t-ctrl"><button onClick={() => setT((t + np - 1) % np)} aria-label="Previous">←</button><button onClick={() => setT((t + 1) % np)} aria-label="Next">→</button></div></div>
        <div className="rv r"><div className="t-wrap"><div className="t-track" style={{ transform: `translateX(-${(t % np) * 100}%)` }}>
          {C.principles.map((p, i) => <div key={i} className="t-item"><p>“{p.q}”</p><div className="who"><div className="av">✓</div><div><h4>{p.t}</h4><span>Our promise</span></div></div></div>)}
        </div></div></div>
      </div></section>

      {/* NUMBERS */}
      <section className="numbers"><div className="container grid">
        <div className="rv l"><span className="eyebrow" style={{ color: "var(--orange-2)" }}>{H.network.eyebrow}</span><h2 className="sec-title">{H.network.title}</h2><p>{C.networkText}</p></div>
        <div className="counters">{C.numbers.map((n, i) => <div key={i} className={`count rv z d${(i % 4) + 1}`}><Counter to={n.n} /><span>{n.l}</span></div>)}</div>
      </div></section>

      {/* FAQ */}
      <section className="faq" id="faq"><div className="container grid">
        <div className="rv l"><span className="eyebrow">{H.faq.eyebrow}</span><h2 className="sec-title" style={{ marginBottom: 34 }}>{H.faq.title}</h2>
          {C.faqs.map((f, i) => (
            <div key={i} className={`acc-item ${faq === i ? "open" : ""}`}><button className="acc-q" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? -1 : i)}>{f.q}<i>+</i></button>
              <div className="acc-a" style={{ maxHeight: faq === i ? 260 : 0 }}><p>{f.a}</p></div></div>
          ))}
        </div>
        <div className="faq-media rv r"><svg viewBox="0 0 400 460" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}><circle cx="320" cy="80" r="90" fill="#ffffff14" /><circle cx="70" cy="380" r="120" fill="#f39a3233" /></svg>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 32, textAlign: "center", color: "#fff" }}><div><p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "2rem", lineHeight: 1.2 }}>Need urgent help?</p><p style={{ margin: "10px 0 22px", opacity: 0.85 }}>Call the nearest IOF committee any time.</p><a href="#contact" className="btn btn-primary">{CONTACT.phone}</a></div></div></div>
      </div></section>

      {/* CONTACT */}
      <section className="blog" id="contact"><div className="container">
        <div className="sec-head center rv"><Head k="contact" /></div>
        <div className="cards3">
          {[["Report a case", `Call ${CONTACT.phone} or write to ${CONTACT.email} with the person’s name, location and the problem.`, "/report", "Report online"], ["Volunteer", "Join your local committee as a coordinator or case handler and help families in crisis.", "mailto:" + CONTACT.email + "?subject=Volunteer", "Offer to help"], ["IOF staff & coordinators", "Sign in to the Seva case-management portal to register, assign and update cases.", "/login", "Seva Portal Login"]].map(([tt, d, h, b], i) => (
            <article key={tt} className={`post rv d${i + 1}`}><div className="tx" style={{ padding: 34 }}><h3>{tt}</h3><p style={{ color: "var(--muted)", marginBottom: 18 }}>{d}</p>{String(h).startsWith("/") ? <Link className="rm" href={h}>{b} →</Link> : <a className="rm" href={h}>{b} →</a>}</div></article>
          ))}
        </div>
      </div></section>

      <section className="cta"><div className="container"><div className="cta-box rv z"><h2>{C.cta.title}</h2><a href="#contact" className="btn">{C.cta.button} <span className="arr">→</span></a></div></div></section>

      <footer>
        <div className="container f-grid">
          <div><a href="#home" className="logo-chip" style={{ width: 170, marginBottom: 18 }}><IofLogo width={170} /></a><p>{C.footer.tagline}</p></div>
          <div><h4>Quick links</h4><ul><li><a href="#about">About</a></li><li><a href="#causes">Cases we support</a></li><li><a href="#process">How it works</a></li><li><a href="#faq">FAQ</a></li></ul></div>
          <div><h4>Provinces</h4><ul><li><a href="#provinces">Eastern</a></li><li><a href="#provinces">Central</a></li><li><a href="#provinces">Western</a></li><li><Link href="/login">Staff portal</Link></li></ul></div>
          <div><h4>Contact</h4><p>{CONTACT.address}</p><p>{CONTACT.phone}</p><p>{CONTACT.email}</p></div>
        </div>
        <div className="container copy"><span>{C.footer.copyright}</span><span>{C.footer.note}</span></div>
      </footer>
      <button id="top" className={top ? "show" : ""} aria-label="Back to top" onClick={() => scrollTo({ top: 0, behavior: "smooth" })}>↑</button>
    </>
  );
}
