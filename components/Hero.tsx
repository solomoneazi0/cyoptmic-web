"use client";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import Sky from "./sky/Sky";
import { Arrow } from "./Icons";
import Decode from "./Decode";

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .from(".hero-fade", { opacity: 0, y: 14, duration: 1, stagger: 0.08, delay: 0.5 });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="top"
      className="hero relative flex min-h-[100svh] flex-col justify-end overflow-hidden pt-[calc(var(--nav-h)+2rem)] pb-12 md:pb-14"
    >
      <Sky />

      <div className="shell pointer-events-none relative z-10 w-full">
        <div className="mx-auto max-w-[1600px]">
          <div className="max-w-[min(62vw,960px)] max-md:max-w-none">
            <p className="hero-fade measure mb-6 flex items-center gap-3 max-md:hidden">
              <span className="text-ember">Cyoptmic</span>
              <span className="h-px w-6 bg-current opacity-40" />
              <span>Software studio · Lagos</span>
            </p>
            <Decode
              as="h1"
              className="hero-title font-display font-semibold"
              text="Engineering the cyberspace."
              duration={1100}
              delay={200}
              data-x="Heading"
              data-note="Set tight: -5.5% tracking, 0.9 line height. Big type, few words."
            />

            <div className="mt-8 flex flex-col gap-7 md:mt-10 md:flex-row md:items-end md:gap-12">
              <p className="hero-fade lead max-w-[34ch]" data-x="Intro" data-note="34 characters per line at most. Longer lines get skimmed.">
                Web, mobile and custom software, designed and engineered under one roof. Point the telescope at a planet to meet each service.
              </p>
              <div className="hero-fade pointer-events-auto flex shrink-0 flex-wrap items-center gap-3">
                <a href="#contact" className="btn btn-primary" data-x="Button" data-note="52 pixels tall. Easy to hit with a thumb.">
                  Start a project
                  <span className="btn-dot">
                    <Arrow />
                  </span>
                </a>
                <a href="#work" className="btn btn-secondary" data-x="Button" data-note="Secondary action: outline only, so the first one wins.">
                  See the work
                  <span className="btn-dot">
                    <Arrow />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
