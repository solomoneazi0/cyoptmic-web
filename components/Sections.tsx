"use client";
import { useEffect, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { industries, mission, services, site, testimonial, values, work } from "@/lib/content";
import Logo from "./Logo";
import Decode from "./Decode";
import { Arrow } from "./Icons";

/* ---------- Shared: fade/slide anything with [data-reveal] into view ---------- */
export function Reveals() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      });
    });
    return () => ctx.revert();
  }, []);
  return null;
}

function Eyebrow({ n, children }: { n: string; children: string }) {
  return (
    <div className="measure mb-8 flex items-center gap-3">
      <Decode className="text-ember" text={n} duration={300} />
      <span className="h-px w-6 bg-current opacity-40" />
      <Decode text={children} duration={600} />
    </div>
  );
}

const Frame = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`shell ${className}`}>
    <div className="mx-auto max-w-[1600px]">{children}</div>
  </div>
);

/* ---------- Values ---------- */
function ValueCard({ v, i }: { v: (typeof values)[number]; i: number }) {
  // The fill grows from where the pointer comes in, and shrinks back to where it leaves.
  const origin = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--fx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--fy", `${e.clientY - r.top}px`);
  };
  return (
    <article
      data-reveal
      onPointerEnter={origin}
      onPointerLeave={origin}
      className="value-card group relative flex min-h-[18rem] flex-col justify-between overflow-hidden bg-paper p-7 md:p-8"
      data-x="Card"
      data-note="Equal cards, equal weight. No value louder than another."
    >
      <span aria-hidden="true" className="value-fill" />
      <div className="relative flex items-start justify-between">
        <span className="value-num measure text-ember">0{i + 1}</span>
        <span className="value-arrow" aria-hidden="true">
          <Arrow />
        </span>
      </div>
      <div className="relative">
        <Decode as="h3" className="display-3" text={v.title} />
        <p className="value-body mt-3 text-ink-2">{v.body}</p>
      </div>
    </article>
  );
}

export function Values() {
  return (
    <section className="py-28 md:py-40">
      <Frame>
        <Eyebrow n="01">Why Cyoptmic</Eyebrow>
        <Decode
          as="h2"
          className="display-2 relative max-w-[22ch]"
          text={mission}
          duration={1700}
          data-x="Statement"
          data-note="One idea per section. This is the one."
        />
        <div className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
          {values.map((v, i) => (
            <ValueCard key={v.title} v={v} i={i} />
          ))}
        </div>
      </Frame>
    </section>
  );
}

/* ---------- Services: each one is a folder that opens on hover ---------- */
function Folder({ s, i }: { s: (typeof services)[number]; i: number }) {
  const nn = String(i + 1).padStart(2, "0");
  return (
    <a
      href="#contact"
      data-reveal
      className="folder"
      data-x="Folder"
      data-note="Hover opens the folder: the brief slides out with what the service covers."
    >
      <span className="folder-tab" aria-hidden="true">
        <span className="text-ember">{nn}</span>
        <span>Service</span>
      </span>
      <span className="folder-back" aria-hidden="true" />
      <span className="folder-sheet light">
        <span className="flex items-center justify-between font-mono text-[10px] tracking-[0.08em] text-steel uppercase">
          <span>Brief · {nn}</span>
          <span className="folder-state text-ember" />
        </span>
        <span className="mt-3 flex flex-wrap gap-1.5">
          {s.tags.map((t) => (
            <span key={t} className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-ink uppercase">
              {t}
            </span>
          ))}
        </span>
        <span className="mt-3 block h-1.5 w-4/5 rounded bg-ink/10" />
        <span className="mt-1.5 block h-1.5 w-3/5 rounded bg-ink/10" />
      </span>
      <span className="folder-front">
        <span className="flex items-start justify-between gap-4">
          <Decode as="h3" className="display-3" text={s.title} />
          <span className="folder-arrow" aria-hidden="true">
            <Arrow />
          </span>
        </span>
        <span className="folder-body mt-3 block text-ink-2">{s.body}</span>
      </span>
    </a>
  );
}

export function Services() {
  return (
    <section id="services" className="border-t border-line py-28 md:py-40">
      <Frame>
        <Eyebrow n="02">Services</Eyebrow>
        <div className="mb-16 grid gap-8 md:grid-cols-12 md:items-end">
          <Decode
            as="h2"
            className="display-2 md:col-span-8"
            parts={[{ text: "Everything your product needs. " }, { text: "Under one roof.", className: "text-ember" }]}
          />
          <p data-reveal className="lead md:col-span-4">From the first sketch to the server it runs on, one team builds the whole thing.</p>
        </div>
        <div className="grid gap-x-4 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Folder key={s.title} s={s} i={i} />
          ))}
        </div>
      </Frame>
    </section>
  );
}

/* ---------- Industries ---------- */
export function Industries() {
  return (
    <section className="border-t border-line py-24 md:py-32">
      <Frame>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Eyebrow n="03">Who we serve</Eyebrow>
            <p data-reveal className="lead max-w-[30ch]">
              Built for the industries that move fastest, especially in emerging markets.
            </p>
          </div>
          <ul className="relative md:col-span-8">
            {industries.map((name, i) => (
              <li key={name} data-reveal className="group flex items-baseline justify-between border-b border-line py-4 first:border-t">
                <Decode className="display-2 inline-block transition-all duration-500 ease-[var(--ease-lens)] group-hover:translate-x-3 group-hover:text-ember" text={name} />
                <span className="measure">{String(i + 1).padStart(2, "0")}</span>
              </li>
            ))}
          </ul>
        </div>
      </Frame>
    </section>
  );
}

/* ---------- Work ---------- */
// Placeholder artwork: replace with real project screenshots.
function Shot({ name, hue }: { name: string; hue: number }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl"
      style={{ background: `linear-gradient(140deg, hsl(${hue} 65% 58%), hsl(${(hue + 30) % 360} 55% 30%))` }}
    >
      <div className="light absolute inset-[9%] rounded-xl bg-white/90 p-[5%] shadow-2xl transition-transform duration-700 ease-[var(--ease-lens)] group-hover:scale-[1.03]">
        <div className="mb-[6%] flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 rounded-full bg-ink/15" />
          ))}
        </div>
        <span className="font-display text-[clamp(1.25rem,2.4vw,2.25rem)] font-semibold tracking-[-0.04em]" style={{ color: `hsl(${hue} 60% 35%)` }}>
          {name}
        </span>
        <div className="mt-[5%] space-y-2">
          <div className="h-2 w-2/3 rounded bg-ink/10" />
          <div className="h-2 w-1/2 rounded bg-ink/10" />
        </div>
      </div>
    </div>
  );
}

export function Work() {
  const [feature, ...rest] = work;
  return (
    <section id="work" className="border-t border-line py-28 md:py-40">
      <Frame>
        <Eyebrow n="04">Selected work</Eyebrow>
        <div className="mb-14 grid gap-8 md:grid-cols-12 md:items-end">
          <Decode as="h2" className="display-2 md:col-span-8" text="Products we’ve shipped." />
          <p data-reveal className="lead md:col-span-4">Fintech apps, online stores and launch pages for founders in Lagos and beyond.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[feature, ...rest].map((w, i) => (
            <a
              key={w.name}
              href="#contact"
              data-reveal
              className={`group relative block ${i === 0 ? "md:col-span-2" : ""}`}
              data-x="Case study"
              data-note="Same frame for every project, so the work is what you compare."
            >
              <div className={i === 0 ? "aspect-[16/7] max-md:aspect-[16/10]" : "aspect-[16/10]"}>
                <Shot name={w.name} hue={w.hue} />
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <Decode as="h3" className="font-display text-2xl font-semibold tracking-[-0.04em]" text={w.name} />
                  <p className="text-ink-2">{w.body}</p>
                </div>
                <span className="measure shrink-0 pt-1.5 text-ember">{w.kind}</span>
              </div>
            </a>
          ))}
        </div>
      </Frame>
    </section>
  );
}

/* ---------- Testimonial ---------- */
export function Testimonial() {
  return (
    <section className="border-t border-line py-28 md:py-36">
      <Frame>
        <figure data-reveal className="mx-auto max-w-[1100px]">
          <span className="font-display text-7xl leading-none text-ember">“</span>
          <Decode as="blockquote" className="display-3 -mt-4 md:text-5xl" text={testimonial.quote} />
          <figcaption className="measure mt-8 text-sm">
            {testimonial.name} · {testimonial.role}
          </figcaption>
        </figure>
      </Frame>
    </section>
  );
}

/* ---------- Contact: a short brief that opens an email ---------- */
const NEEDS = ["Website", "Mobile app", "Custom software", "UI/UX design", "Something else"];

export function Contact() {
  const [needs, setNeeds] = useState<string[]>([]);
  const toggle = (n: string) => setNeeds((v) => (v.includes(n) ? v.filter((x) => x !== n) : [...v, n]));

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = `Name: ${f.get("name")}\nEmail: ${f.get("email")}\nNeeds: ${needs.join(", ") || "-"}\n\n${f.get("message")}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent("Project enquiry")}&body=${encodeURIComponent(body)}`;
  };

  return (
    <section id="contact" className="border-t border-line py-28 md:py-40">
      <Frame>
        <Eyebrow n="05">Get in touch</Eyebrow>
        <div className="grid gap-14 md:grid-cols-12">
          <div className="relative md:col-span-6">
            <Decode as="h2" className="display-1" parts={[{ text: "Tell us about your " }, { text: "project.", className: "text-ember" }]} />
            <dl data-reveal className="mt-12 grid gap-6 text-ink-2 sm:grid-cols-2">
              <div>
                <dt className="measure mb-1">Email</dt>
                <dd>
                  <a href={`mailto:${site.email}`} className="text-ink hover:text-ember">
                    {site.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="measure mb-1">Phone</dt>
                <dd>
                  <a href={site.phoneHref} className="text-ink hover:text-ember">
                    {site.phone}
                  </a>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="measure mb-1">Office</dt>
                <dd className="text-ink">{site.address.join(", ")}</dd>
              </div>
            </dl>
          </div>

          <form
            data-reveal
            onSubmit={submit}
            className="space-y-6 rounded-3xl border border-line bg-paper-2/50 p-6 md:col-span-6 md:p-9"
            data-x="Form"
            data-note="Four fields. Every extra field costs replies."
          >
            <fieldset>
              <legend className="measure mb-3">What do you need?</legend>
              <div className="flex flex-wrap gap-2">
                {NEEDS.map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => toggle(n)}
                    aria-pressed={needs.includes(n)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      needs.includes(n) ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/40"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="measure mb-2 block">Name</span>
                <input name="name" required className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-ink" />
              </label>
              <label className="block">
                <span className="measure mb-2 block">Email</span>
                <input name="email" type="email" required className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-ink" />
              </label>
            </div>
            <label className="block">
              <span className="measure mb-2 block">About the project</span>
              <textarea name="message" rows={4} className="w-full resize-none rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-ink" />
            </label>
            <button type="submit" className="btn btn-primary">
              Send the brief
              <span className="btn-dot">
                <Arrow />
              </span>
            </button>
          </form>
        </div>
      </Frame>
    </section>
  );
}

/* ---------- Footer ---------- */
export function Footer() {
  return (
    <footer className="relative border-t border-line pt-16 pb-24 md:pb-16">
      <Frame>
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div className="flex items-center gap-4">
            <Logo className="h-[clamp(3rem,7vw,6rem)] w-auto text-ink" />
            <Decode
              className="font-display text-[clamp(3.5rem,10vw,9rem)] leading-[0.85] font-semibold tracking-[-0.06em]"
              parts={[{ text: "cyoptmic" }, { text: ".", className: "text-ember" }]}
            />
          </div>
          <div className="space-y-3 text-right max-md:text-left">
            <ul className="flex gap-5 text-sm md:justify-end">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} className="hover:text-ember">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="measure">© {new Date().getFullYear()} Cyoptmic · Engineering the cyberspace.</p>
          </div>
        </div>
      </Frame>
    </footer>
  );
}
