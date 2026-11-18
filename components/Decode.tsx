"use client";
import { useEffect, useRef } from "react";
import { ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+<>/=?";
const rand = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

type Part = { text: string; className?: string };
type Tag = "h1" | "h2" | "h3" | "p" | "span" | "div" | "blockquote";

/**
 * Text that "decodes": each letter flickers through random characters, then locks into
 * place, left to right. Plays when it scrolls into view, or whenever `active` turns true.
 *
 * Layout never moves: the real letters are always laid out (transparent until decoded),
 * and the random characters are drawn on top of them with ::after.
 */
export default function Decode({
  as: El = "span",
  text,
  parts,
  className = "",
  duration,
  delay = 0,
  active,
  ...rest
}: {
  as?: Tag;
  text?: string;
  parts?: Part[];
  className?: string;
  /** Time for the sweep across the whole text, ms. Defaults to a length-based value. */
  duration?: number;
  delay?: number;
  /** If set, plays every time this turns true (instead of on scroll). */
  active?: boolean;
  "data-x"?: string;
  "data-note"?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const list: Part[] = parts ?? [{ text: text ?? "" }];
  const full = list.map((p) => p.text).join("");
  const controlled = active !== undefined;

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const chars = Array.from(el.querySelectorAll<HTMLElement>(".dc"));
    const n = chars.length;
    if (!n) return;

    let raf = 0;
    let timer = 0;
    const arm = () => {
      el.classList.add("decode-armed");
      chars.forEach((c) => {
        c.classList.remove("on");
        c.removeAttribute("data-g");
      });
    };
    const run = () => {
      cancelAnimationFrame(raf);
      arm();
      const sweep = duration ?? Math.min(1300, 320 + n * 8);
      const win = Math.min(360, 160 + n * 2); // how long each letter scrambles
      const state = new Uint8Array(n); // 0 hidden, 1 scrambling, 2 done
      let t0 = 0;
      let frame = 0;
      const step = (now: number) => {
        if (!t0) t0 = now;
        const t = now - t0;
        frame++;
        let left = 0;
        for (let i = 0; i < n; i++) {
          if (state[i] === 2) continue;
          const ti = (i / n) * sweep;
          const c = chars[i];
          if (t >= ti + win) {
            state[i] = 2;
            c.removeAttribute("data-g");
            c.classList.add("on");
            continue;
          }
          left++;
          if (t >= ti) {
            state[i] = 1;
            if (frame % 2 === 0 || !c.dataset.g) c.dataset.g = rand();
          }
        }
        if (left) raf = requestAnimationFrame(step);
        else {
          el.classList.remove("decode-armed");
          chars.forEach((c) => c.classList.remove("on"));
        }
      };
      timer = window.setTimeout(() => (raf = requestAnimationFrame(step)), delay);
    };

    let st: ScrollTrigger | undefined;
    if (controlled) {
      if (active) run();
      else arm();
    } else {
      arm();
      st = ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: run });
    }
    return () => {
      st?.kill();
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      el.classList.remove("decode-armed");
    };
  }, [duration, delay, active, controlled]);

  return (
    <El ref={ref as never} className={`decode ${className}`} {...rest}>
      <span className="sr-only">{full}</span>
      <span aria-hidden="true">
        {list.map((p, pi) => (
          <span key={pi} className={p.className}>
            {p.text.split(/(\s+)/).map((w, wi) =>
              /^\s+$/.test(w) ? (
                " "
              ) : w ? (
                <span key={wi} className="whitespace-nowrap">
                  {Array.from(w).map((ch, ci) => (
                    <span key={ci} className="dc">
                      {ch}
                    </span>
                  ))}
                </span>
              ) : null
            )}
          </span>
        ))}
      </span>
    </El>
  );
}
