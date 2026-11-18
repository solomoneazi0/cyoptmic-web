"use client";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { nav, site } from "@/lib/content";

export default function Nav() {
  const [xray, setXray] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("xray", xray);
  }, [xray]);
  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", menu);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <>
      <header id="site-nav" className="fixed inset-x-0 top-0 z-50">
        <nav
          className="shell flex h-[var(--nav-h)] items-center justify-between bg-gradient-to-b from-paper via-paper/80 to-transparent"
          data-x="Navigation"
          data-note="Three actions on the right, never more. Everything else lives in the menu."
        >
          <a href="#top" className="flex items-center gap-2" aria-label="Cyoptmic, back to top">
            <Logo className="h-6 w-auto text-ink" />
            <span className="font-display text-xl font-semibold tracking-[-0.04em]">
              cyoptmic<span className="text-ember">.</span>
            </span>
          </a>

          <div className="flex items-center gap-2 md:gap-6">
            <button
              onClick={() => setXray((v) => !v)}
              aria-pressed={xray}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
                xray ? "bg-ink text-paper" : "hover:bg-paper-2"
              }`}
              title="Show the design decisions behind the page"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="M15.5 15.5 21 21" />
              </svg>
              X-ray
            </button>
            <a href="#contact" className="hidden text-sm font-medium hover:text-ember md:inline">
              Start a project
            </a>
            <button
              onClick={() => setMenu((v) => !v)}
              aria-expanded={menu}
              aria-label={menu ? "Close menu" : "Open menu"}
              className="relative z-[80] grid h-10 w-10 place-items-center rounded-full bg-ink text-paper transition-transform hover:scale-105"
            >
              <span className={`absolute h-[1.5px] w-4 bg-current transition-transform ${menu ? "rotate-45" : "-translate-y-[3px]"}`} />
              <span className={`absolute h-[1.5px] w-4 bg-current transition-transform ${menu ? "-rotate-45" : "translate-y-[3px]"}`} />
            </button>
          </div>
        </nav>
      </header>

      {/* Full-screen menu */}
      <div
        className={`fixed inset-0 z-[75] bg-paper transition-[clip-path] duration-700 ease-[var(--ease-lens)] ${
          menu ? "[clip-path:circle(150%_at_calc(100%-3rem)_2.25rem)]" : "pointer-events-none [clip-path:circle(0%_at_calc(100%-3rem)_2.25rem)]"
        }`}
        aria-hidden={!menu}
      >
        <div className="shell flex h-full flex-col justify-between pt-28 pb-10">
          <ul className="space-y-1">
            {nav.map((n, i) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  onClick={() => setMenu(false)}
                  tabIndex={menu ? 0 : -1}
                  className="group flex items-baseline gap-4 font-display text-[clamp(2.75rem,8vw,6.5rem)] leading-[1] font-semibold tracking-[-0.05em] hover:text-ember"
                >
                  <span className="measure">0{i + 1}</span>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="grid gap-6 text-ink-2 md:grid-cols-3">
            <a href={`mailto:${site.email}`} tabIndex={menu ? 0 : -1} className="hover:text-ember">
              {site.email}
            </a>
            <a href={site.phoneHref} tabIndex={menu ? 0 : -1} className="hover:text-ember">
              {site.phone}
            </a>
            <span>{site.address.join(", ")}</span>
          </div>
        </div>
      </div>
    </>
  );
}
