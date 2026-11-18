"use client";
import { useEffect, useRef } from "react";

const STEP = 64;
const LABELS = 24;

/** Measuring rulers on the left and right edges. The left one counts page pixels as you scroll. */
export default function Rulers() {
  const ticks = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const dot = useRef<HTMLSpanElement>(null);
  const labelBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Write-only on scroll: no layout reads here (they force a full-page relayout every frame).
    let raf = 0;
    let max = 1;
    let vh = window.innerHeight;
    let lastFirst = -1;
    const measure = () => {
      vh = window.innerHeight;
      max = Math.max(1, document.documentElement.scrollHeight - vh);
    };
    const draw = () => {
      raf = 0;
      const y = window.scrollY;
      const off = y % STEP;
      if (ticks.current) ticks.current.style.transform = `translateY(${-off}px)`;
      const first = Math.floor(y / STEP) * STEP;
      if (first !== lastFirst) {
        lastFirst = first;
        labels.current.forEach((el, i) => el && (el.textContent = String(first + (i + 1) * STEP)));
      }
      if (labelBox.current) labelBox.current.style.transform = `translateY(${-off}px)`;
      if (dot.current) dot.current.style.transform = `translateY(${Math.min(1, y / max) * (vh - 24) + 12}px)`;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const onResize = () => {
      measure();
      on();
    };
    measure();
    draw();
    const late = window.setTimeout(measure, 2500); // page height after fonts and images settle
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(late);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed top-0 left-0 z-40 hidden h-full w-9 select-none md:block">
        <div ref={ticks} className="ruler-ticks absolute top-0 left-0 h-[calc(100%+64px)] w-2.5 will-change-transform" />
        <div ref={labelBox} className="absolute inset-0 will-change-transform">
          {Array.from({ length: LABELS }, (_, i) => (
            <span
              key={i}
              ref={(n) => {
                labels.current[i] = n;
              }}
              className="absolute left-3.5 font-mono text-[9px] text-steel tabular-nums"
              style={{ top: (i + 1) * STEP - 5 }}
            />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none fixed top-0 right-0 z-40 hidden h-full w-3 md:block">
        <div className="ruler-ticks absolute inset-y-0 right-0 w-full opacity-60 [transform:scaleX(-1)]" />
        <span ref={dot} className="absolute top-0 right-1 h-1.5 w-1.5 rounded-full bg-ember will-change-transform" />
      </div>
      {/* 12-column grid, shown in X-ray mode */}
      <div aria-hidden="true" className="xray-grid shell">
        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-4 gap-4 md:grid-cols-12 md:gap-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className={`h-full bg-ember/[0.06] ${i >= 4 ? "max-md:hidden" : ""}`} />
          ))}
        </div>
      </div>
    </>
  );
}
