"use client";
import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { build } from "@/lib/content";
import { Arrow } from "./Icons";
import Decode from "./Decode";

const N = build.length;

/** Fade/slide helper for layers that switch on at a given step. */
const show = (on: boolean, extra = "") =>
  `transition-all duration-700 ease-[var(--ease-lens)] ${on ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"} ${extra}`;

function Check({ className = "" }: { className?: string }) {
  return (
    <span className={`grid h-[2.2cqw] w-[2.2cqw] place-items-center rounded-full bg-emerald-500 text-white shadow ${className}`}>
      <svg viewBox="0 0 16 16" className="h-[60%] w-[60%]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
      </svg>
    </span>
  );
}

/** The illustration: a product built up layer by layer as `step` increases. */
function Board({ step }: { step: number }) {
  const hifi = step >= 2;
  const real = step >= 3;
  const tested = step >= 4;
  const live = step >= 5;
  const done = step >= 6;

  return (
    <div
      className={`relative mx-auto aspect-[16/10] w-[min(88vw,1040px,calc((100svh-17rem)*1.6))] [container-type:inline-size] transition-all duration-700 ease-[var(--ease-lens)] ${
        done ? "scale-[0.94] opacity-25 blur-[1px]" : ""
      }`}
      data-x="Board"
      data-note="Every layer appears in the order we actually build it."
    >
      {/* 0 · Idea */}
      <div className={show(step === 0, "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center")}>
        <span className="pulse-dot mx-auto block h-[1.6cqw] w-[1.6cqw] rounded-full bg-ember" />
        <span className="hand mt-[1.2cqw] block -rotate-2 text-[2.6cqw] text-ember">What if paying bills took two taps?</span>
      </div>

      {/* 1 · Analysis: guides, grid, measurements, research notes */}
      <div className={show(step >= 1, "absolute inset-0")}>
        <div className={`absolute inset-y-[6%] left-[4%] w-[58%] transition-opacity duration-700 ${step === 1 ? "opacity-100" : "opacity-30"}`}>
          <div className="grid h-full grid-cols-12 gap-[0.9cqw]">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="bg-ember/[0.07]" />
            ))}
          </div>
        </div>
        {["4%", "62%", "68%", "94%"].map((l) => (
          <div key={l} className="absolute inset-y-0 w-px border-l border-dashed border-steel/40" style={{ left: l }} />
        ))}
        {["6%", "94%"].map((t) => (
          <div key={t} className="absolute inset-x-0 h-px border-t border-dashed border-steel/40" style={{ top: t }} />
        ))}
        <span className="measure absolute top-[1.5%] left-[4%] w-[58%] text-center text-[1.05cqw]">← 1440 →</span>
        <span className="measure absolute top-[1.5%] left-[68%] w-[26%] text-center text-[1.05cqw]">← 390 →</span>
        <span className="measure absolute bottom-[1%] left-[4%] text-[1.05cqw]">12 col · 24 gutter</span>
        <div className={show(step === 1, "absolute top-[18%] left-[12%] flex flex-col gap-[1.2cqw]")}>
          {["Who pays the bills?", "On which phone?", "On what network?"].map((q, i) => (
            <span
              key={q}
              className="hand w-fit rounded-[0.5cqw] bg-gold/70 px-[1.4cqw] py-[0.9cqw] text-[1.7cqw] text-[#190a05] shadow-sm"
              style={{ rotate: `${[-3, 2, -1.5][i]}deg`, marginLeft: `${i * 4}cqw` }}
            >
              {q}
            </span>
          ))}
        </div>
      </div>

      {/* 2+ · Desktop screen */}
      <div
        className={show(
          hifi,
          `light absolute top-[8%] left-[4%] h-[82%] w-[58%] overflow-hidden rounded-[1cqw] ${
            real ? "bg-white border border-line shadow-[0_2.5cqw_6cqw_-2cqw_rgba(0,0,0,0.7)]" : "bg-white border-[1.5px] border-dashed border-ember/60"
          }`
        )}
      >
        {!real && <span className="measure absolute top-[1cqw] left-[1.2cqw] text-[1cqw] text-ember">Frame · Desktop</span>}
        <div className={`flex h-[7%] items-center gap-[0.6cqw] border-b border-line px-[1.2cqw] transition-opacity duration-500 ${real ? "opacity-100" : "opacity-0"}`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[0.8cqw] w-[0.8cqw] rounded-full bg-paper-2" />
          ))}
          <span className="ml-[1.5cqw] flex h-[60%] flex-1 items-center gap-[0.6cqw] rounded-full bg-paper px-[1cqw] font-mono text-[0.95cqw] text-steel">
            {live ? (
              <>
                <span className="live-dot h-[0.7cqw] w-[0.7cqw] rounded-full bg-emerald-500" />
                app.yourproduct.com
              </>
            ) : (
              "localhost:3000"
            )}
          </span>
          {live && <span className="rounded-full bg-emerald-500/15 px-[0.8cqw] py-[0.2cqw] font-mono text-[0.9cqw] text-emerald-700">LIVE</span>}
        </div>
        <div className="grid h-[93%] grid-cols-[1.15fr_1fr] gap-[2cqw] p-[2.4cqw]">
          <div className="flex flex-col justify-center">
            <span className="mb-[1.5cqw] font-mono text-[0.95cqw] tracking-wider text-ember uppercase">your·app</span>
            <span className="font-display text-[3.4cqw] leading-[0.95] font-semibold tracking-[-0.05em]">Bills, paid in two taps.</span>
            <span className="mt-[1.4cqw] text-[1.15cqw] leading-snug text-ink-2">Electricity, data and TV from one balance. No queues.</span>
            <span className="relative mt-[2cqw] w-fit rounded-full bg-ink px-[1.8cqw] py-[0.9cqw] text-[1.15cqw] text-paper">
              Pay a bill
              {tested && <Check className="absolute -top-[1cqw] -right-[1cqw]" />}
            </span>
          </div>
          <div className="relative flex flex-col gap-[1cqw] self-center rounded-[1cqw] bg-paper p-[1.6cqw]">
            {tested && <Check className="absolute -top-[1cqw] -right-[1cqw]" />}
            <span className="font-mono text-[0.9cqw] text-steel">Balance</span>
            <span className="font-display text-[2.4cqw] font-semibold tracking-[-0.04em]">₦248,500</span>
            <div className="flex h-[6cqw] items-end gap-[0.6cqw]">
              {[40, 65, 50, 85, 60, 95].map((h, i) => (
                <span key={i} className={`flex-1 rounded-t-[0.3cqw] ${i === 5 ? "bg-ember" : "bg-ink/15"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
            {["Electricity", "Data", "TV"].map((b, i) => (
              <div key={b} className="flex items-center justify-between border-t border-line pt-[0.7cqw] text-[1cqw]">
                <span>{b}</span>
                <span className="font-mono text-steel">−₦{[12, 5, 9][i]},000</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2+ · Phone screen */}
      <div
        className={show(
          hifi,
          `light absolute top-[12%] left-[70%] h-[76%] w-[22%] overflow-hidden ${
            real ? "bg-white rounded-[2.6cqw] border-[0.6cqw] border-[#2a2a31] shadow-[0_2.5cqw_6cqw_-2cqw_rgba(0,0,0,0.7)]" : "bg-white rounded-[1cqw] border-[1.5px] border-dashed border-ember/60"
          }`
        )}
      >
        {!real && <span className="measure absolute top-[0.6cqw] left-[1cqw] text-[0.9cqw] text-ember">Frame · Mobile</span>}
        <div className="flex h-full flex-col gap-[1cqw] p-[1.4cqw] pt-[3cqw]">
          <span className="font-mono text-[0.8cqw] text-steel">Balance</span>
          <span className="font-display text-[2.1cqw] font-semibold tracking-[-0.04em]">₦248,500</span>
          <div className="grid grid-cols-2 gap-[0.6cqw]">
            <span className="relative rounded-full bg-ember py-[0.6cqw] text-center text-[0.95cqw] text-white">
              Pay
              {tested && <Check className="absolute -top-[1cqw] -right-[0.6cqw] scale-75" />}
            </span>
            <span className="rounded-full bg-paper py-[0.6cqw] text-center text-[0.95cqw]">Top up</span>
          </div>
          {["Electricity", "Data", "TV", "Water"].map((b) => (
            <div key={b} className="flex items-center gap-[0.8cqw] border-t border-line pt-[0.8cqw] text-[0.95cqw]">
              <span className="h-[1.8cqw] w-[1.8cqw] rounded-full bg-paper-2" />
              {b}
            </div>
          ))}
        </div>
      </div>

      {/* 3+ · Code */}
      <div className={show(real && !live, "absolute top-[56%] left-[1%] w-[40%] rounded-[1cqw] border border-line bg-[#14141a] p-[1.6cqw] font-mono text-[1.05cqw] leading-[1.7] text-ink/90 shadow-2xl")}>
        <div className="mb-[0.8cqw] flex gap-[0.5cqw]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[0.7cqw] w-[0.7cqw] rounded-full bg-ink/25" />
          ))}
        </div>
        <div>
          <span className="text-ember">export function</span> <span className="text-gold">PayButton</span>({"{ bill }"}) {"{"}
        </div>
        <div className="pl-[2cqw]">
          <span className="text-ember">return</span> {"<"}
          <span className="text-gold">Button</span> <span className="text-ink/60">onClick</span>={"{() => pay(bill)}"}{">"}
        </div>
        <div className="pl-[4cqw]">Pay {"{bill.name}"}</div>
        <div className="pl-[2cqw]">
          {"</"}
          <span className="text-gold">Button</span>
          {">"}
        </div>
        <div>{"}"}</div>
      </div>

      {/* 4+ · Test results */}
      <div className={show(tested, "absolute top-[91%] left-[64%] flex flex-wrap gap-[0.6cqw]")}>
        {["iOS", "Android", "Chrome", "Safari", "Slow 3G"].map((t) => (
          <span key={t} className="flex items-center gap-[0.4cqw] rounded-full border border-line bg-paper-2 px-[0.9cqw] py-[0.3cqw] font-mono text-[0.95cqw]">
            <span className="text-emerald-400">✓</span>
            {t}
          </span>
        ))}
      </div>

      {/* 5+ · Deploy */}
      <div className={show(live, "absolute top-[60%] left-[1%] w-[40%] rounded-[1cqw] border border-line bg-[#14141a] p-[1.6cqw] font-mono text-[1.05cqw] leading-[1.8] text-ink/90 shadow-2xl")}>
        <div className="text-ink/50">$ deploy --production</div>
        <div>
          <span className="text-emerald-400">✓</span> Build passed
        </div>
        <div>
          <span className="text-emerald-400">✓</span> Tests passed
        </div>
        <div>
          <span className="text-emerald-400">✓</span> Live at app.yourproduct.com
        </div>
      </div>
    </div>
  );
}

export default function Build() {
  const section = useRef<HTMLElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!section.current) return;
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = self.progress;
        if (pct.current) pct.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
        setStep(Math.min(N - 1, Math.floor(p * N * 0.999)));
      },
    });
    return () => st.kill();
  }, []);

  return (
    <section id="process" ref={section} className="relative" style={{ height: `${N * 65 + 40}vh` }} aria-label="From an idea to a product.">
      <h2 className="sr-only">From an idea to a product.</h2>
      <ol className="sr-only">
        {build.map((s) => (
          <li key={s.title}>
            {s.title} {s.body}
          </li>
        ))}
      </ol>

      <div data-sticky className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="shell pointer-events-none absolute inset-x-0 top-[calc(var(--nav-h)+0.9rem)] z-[6] flex justify-between">
          <div>
            <div className="measure">The build</div>
            <div className="measure text-ink">From an idea to a product.</div>
          </div>
          <div className="text-right">
            <div className="measure">Build progress</div>
            <div className="font-display text-3xl font-semibold tracking-[-0.04em] tabular-nums">
              <span ref={pct}>000</span>
              <span className="text-ember">%</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 top-[calc(var(--nav-h)+5rem)] bottom-[11rem] flex items-center justify-center md:bottom-[9.5rem]">
          <Board step={step} />
        </div>

        {/* 6 · Your turn */}
        <div className={show(step === N - 1, "absolute inset-0 z-[7] grid place-items-center")}>
          <div className="text-center">
            <p className="hand mb-5 -rotate-2 text-2xl text-ember">Everything above, for your idea.</p>
            <a href="#contact" className="btn btn-primary h-16 pl-8 text-lg">
              Start a project
              <span className="btn-dot h-12 w-12">
                <Arrow className="h-4 w-4" />
              </span>
            </a>
          </div>
        </div>

        {/* Captions */}
        <div className="shell pointer-events-none absolute inset-x-0 bottom-0 z-[8] pb-7 md:pb-9">
          <div className="relative min-h-[8.5rem] max-w-[34rem] md:min-h-[7.5rem]">
            {build.map((s, i) => (
              <div
                key={s.title}
                className={`absolute inset-x-0 bottom-0 transition-all duration-700 ease-[var(--ease-lens)] ${
                  i === step ? "translate-y-0 opacity-100 blur-0" : "translate-y-3 opacity-0 blur-[2px]"
                }`}
              >
                <div className="measure mb-2 flex items-center gap-2">
                  <span className="text-ember">{String(i + 1).padStart(2, "0")}</span>
                  <span className="h-px w-6 bg-current opacity-40" />
                  <span>{String(N).padStart(2, "0")}</span>
                </div>
                <Decode as="h3" className="display-3" text={s.title} active={i === step} />
                <p className="mt-2 max-w-[42ch] text-ink-2">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
