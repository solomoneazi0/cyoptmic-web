"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import {
  sky,
  planets,
  layout,
  placePlanets,
  makeStars,
  rigToHero,
  rng,
  ZOOM,
  COS_YAW,
  PIVOT,
  TUBE_FRONT,
  PHI_MIN,
  PHI_MAX,
} from "@/lib/sky";
import { Arrow } from "../Icons";

// The astronaut (Three.js) loads once the browser is idle.
const SkyScene = dynamic(() => import("./SkyScene"), { ssr: false, loading: () => null });

const STORE = "cyoptmic-planets";
const AST_POOL = 3;
type Mode = "home" | "free" | "return" | "track";

/**
 * The hero sky: stars, a sun, six planets (one per service) and a telescope view you drag around.
 *
 * Performance rules (the loop runs every frame while the hero is on screen):
 * - No layout reads in the loop. Sizes are measured on load and resize only.
 * - Everything that moves is moved with transforms.
 * - The star field is drawn once; the telescope's own star canvas redraws only when the view moves.
 * - Nothing runs once the hero has scrolled away.
 */
export default function Sky() {
  const root = useRef<HTMLDivElement>(null);
  const starCanvas = useRef<HTMLCanvasElement>(null);
  const orbits = useRef<SVGSVGElement>(null);
  const sun = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLDivElement | null)[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const lensStars = useRef<HTMLCanvasElement>(null);
  const lensSun = useRef<HTMLDivElement>(null);
  const lensPlanets = useRef<(HTMLDivElement | null)[]>([]);
  const shades = useRef<(HTMLSpanElement | null)[]>([]);
  const astSky = useRef<(HTMLDivElement | null)[]>([]);
  const astLens = useRef<(HTMLDivElement | null)[]>([]);
  const readout = useRef<HTMLSpanElement>(null);
  const hud = useRef<HTMLElement>(null);

  const [gl, setGl] = useState(false);
  const [live, setLive] = useState(true);
  const [ready, setReady] = useState(false);
  const [found, setFound] = useState<number[]>([]);
  const [lock, setLock] = useState(-1);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const el = root.current!;
    const hero = el.parentElement!;
    const doc = document.documentElement;
    const reduced = prefersReducedMotion();
    const E = {
      stars: starCanvas.current!,
      orbits: orbits.current!,
      sun: sun.current!,
      box: box.current!,
      line: line.current!,
      lens: lens.current!,
      lensStars: lensStars.current!,
      lensSun: lensSun.current!,
      readout: readout.current!,
      hud: hud.current!,
    };

    let mode: Mode = "home";
    let held = false;
    let started = false;
    let visible = true;
    let R = 130;
    let dpr = 1;
    let trackI = -1;
    let lockI = -1;
    let timeScale = reduced ? 0 : 1;
    let hudW = 290;
    let hudH = 220;
    const pos = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const grab = { dx: 0, dy: 0, left: 0, top: 0 };
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    const navH = () => parseFloat(getComputedStyle(doc).getPropertyValue("--nav-h")) * 16 || 72;
    let topLimit = 80;

    /* ---------- Found planets ---------- */
    let saved: number[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(STORE) || "[]");
    } catch {}
    const foundSet = new Set(saved.filter((i) => i >= 0 && i < planets.length));
    setFound([...foundSet]);
    const dwell = new Map<number, number>();

    /* ---------- Static layers: drawn on load and resize ---------- */
    const drawStars = () => {
      const { W, H, sun: s } = sky;
      const c = E.stars;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      const g = c.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Faint nebulae
      const neb = (x: number, y: number, r: number, col: string) => {
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, col);
        gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);
      };
      neb(s.x, s.y, Math.max(W, H) * 0.55, "rgba(230,88,47,0.10)");
      neb(W * 0.12, H * 0.18, W * 0.45, "rgba(110,80,200,0.07)");
      neb(W * 0.9, H * 0.95, W * 0.35, "rgba(60,150,170,0.05)");
      for (const st of makeStars(W, H)) {
        g.fillStyle = `rgba(${st.c},${st.a})`;
        g.beginPath();
        g.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        g.fill();
      }
    };

    const drawOrbits = () => {
      const { sun: s, orbit } = sky;
      const deg = (orbit.rot * 180) / Math.PI;
      E.orbits.setAttribute("viewBox", `0 0 ${sky.W} ${sky.H}`);
      E.orbits.innerHTML = planets
        .map((p) => {
          const a = orbit.base * p.f;
          return `<ellipse cx="${s.x}" cy="${s.y}" rx="${a}" ry="${a * orbit.flat}" transform="rotate(${deg} ${s.x} ${s.y})"/>`;
        })
        .join("");
    };

    const measure = () => {
      const r = hero.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      R = parseFloat(getComputedStyle(doc).getPropertyValue("--lens-r")) || 130;
      layout(r.width, r.height, R);
      topLimit = navH() + R * 0.35;
      drawStars();
      drawOrbits();
      const { sun: s, rig } = sky;
      E.sun.style.width = E.sun.style.height = `${s.r * 2}px`;
      E.sun.style.transform = `translate(${s.x - s.r}px, ${s.y - s.r}px)`;
      E.lensSun.style.width = E.lensSun.style.height = `${s.r * 2 * ZOOM}px`;
      E.box.style.width = `${rig.boxW}px`;
      E.box.style.height = `${rig.boxH}px`;
      E.box.style.transform = `translate(${rig.boxX}px, ${rig.boxY}px)`;
      E.lensStars.width = E.lensStars.height = Math.round(2 * R * dpr);
      if (mode === "home") {
        pos.x = target.x = sky.home.x;
        pos.y = target.y = sky.home.y;
      } else {
        target.x = clamp(target.x, R * 0.6, sky.W - R * 0.6);
        target.y = clamp(target.y, topLimit, sky.H - R * 0.6);
      }
      lastLX = -1;
      measureHud();
    };
    const measureHud = () => {
      hudW = E.hud.offsetWidth || 290;
      hudH = E.hud.offsetHeight || 220;
    };

    /* ---------- The telescope's own star canvas (redrawn only when the view moves) ---------- */
    let lastLX = -1;
    let lastLY = -1;
    const drawLensStars = (lx: number, ly: number) => {
      const g = E.lensStars.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, 2 * R, 2 * R);
      const half = R / ZOOM + 4;
      const toX = (x: number) => (x - lx) * ZOOM + R;
      const toY = (y: number) => (y - ly) * ZOOM + R;
      // Orbit lines, magnified
      const { sun: s, orbit } = sky;
      g.save();
      g.translate(toX(s.x), toY(s.y));
      g.rotate(orbit.rot);
      g.strokeStyle = "rgba(255,255,255,0.10)";
      g.lineWidth = 1;
      g.setLineDash([3, 6]);
      for (const p of planets) {
        const a = orbit.base * p.f * ZOOM;
        g.beginPath();
        g.ellipse(0, 0, a, a * orbit.flat, 0, 0, Math.PI * 2);
        g.stroke();
      }
      g.restore();
      // Stars you can see with the naked eye: still points, just brighter
      for (const st of sky.stars) {
        if (Math.abs(st.x - lx) > half || Math.abs(st.y - ly) > half) continue;
        g.fillStyle = `rgba(${st.c},${Math.min(1, st.a + 0.2)})`;
        g.beginPath();
        g.arc(toX(st.x), toY(st.y), st.r * 1.5, 0, Math.PI * 2);
        g.fill();
      }
      // ...and the faint ones only the telescope shows (fixed per 12px cell of sky)
      const cell = 12;
      for (let cx = Math.floor((lx - half) / cell); cx <= Math.floor((lx + half) / cell); cx++) {
        for (let cy = Math.floor((ly - half) / cell); cy <= Math.floor((ly + half) / cell); cy++) {
          const r = rng(cx * 73856093 ^ cy * 19349663);
          if (r() > 0.55) continue;
          const x = (cx + r()) * cell;
          const y = (cy + r()) * cell;
          g.fillStyle = `rgba(255,255,255,${0.12 + r() * 0.4})`;
          g.beginPath();
          g.arc(toX(x), toY(y), 0.5 + r() * 0.9, 0, Math.PI * 2);
          g.fill();
        }
      }
    };

    /* ---------- Frame loop ---------- */
    /* ---------- Asteroids: a few pooled elements, reused ---------- */
    type Ast = { on: boolean; x: number; y: number; vx: number; vy: number; a: number; s: number; len: number };
    const asts: Ast[] = Array.from({ length: AST_POOL }, () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, a: 0, s: 0, len: 0 }));
    let nextAst = performance.now() + 1800;
    const between = (a: number, b: number) => a + Math.random() * (b - a);
    const spawn = () => {
      const k = asts.findIndex((q) => !q.on);
      if (k < 0) return;
      const q = asts[k];
      const big = Math.random() < 0.22;
      const speed = big ? between(220, 320) : between(480, 820);
      let ang: number;
      if (Math.random() < 0.72) {
        // From the top, falling down and to the left
        ang = between(1.95, 2.55);
        q.x = between(sky.W * 0.25, sky.W * 1.1);
        q.y = -30;
      } else {
        // From the left edge, falling down and to the right
        ang = between(0.45, 0.95);
        q.x = -30;
        q.y = between(0, sky.H * 0.45);
      }
      q.vx = Math.cos(ang) * speed;
      q.vy = Math.sin(ang) * speed;
      q.a = ang;
      q.s = big ? between(16, 22) : between(6, 9);
      q.len = big ? between(160, 240) : between(150, 260);
      q.on = true;
      for (const el of [astSky.current[k], astLens.current[k]]) {
        if (!el) continue;
        el.style.setProperty("--s", `${q.s}px`);
        el.style.setProperty("--len", `${q.len}px`);
        el.classList.toggle("big", big);
        el.classList.add("on");
      }
    };
    const moveAsts = (dt: number, now: number) => {
      if (!reduced && now > nextAst) {
        spawn();
        nextAst = now + between(2600, 7000);
      }
      for (let k = 0; k < asts.length; k++) {
        const q = asts[k];
        if (!q.on) continue;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        const se = astSky.current[k];
        const le = astLens.current[k];
        if (q.x < -400 || q.x > sky.W + 400 || q.y > sky.H + 300) {
          q.on = false;
          se?.classList.remove("on");
          le?.classList.remove("on");
          continue;
        }
        if (se) se.style.transform = `translate(${q.x}px, ${q.y}px) rotate(${q.a}rad)`;
        if (le) {
          const lx = (q.x - pos.x) * ZOOM + R;
          const ly = (q.y - pos.y) * ZOOM + R;
          const reach = R + q.len * ZOOM;
          le.style.transform =
            Math.abs(lx - R) < reach && Math.abs(ly - R) < reach
              ? `translate(${lx}px, ${ly}px) rotate(${q.a}rad) scale(${ZOOM})`
              : "translate(-9999px, 0)";
        }
      }
    };

    let prev = performance.now();
    let frame = 0;
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (!visible) return;
      frame++;

      // 1) Planets. Time slows right down while one is in the telescope, so you can read it.
      const want = reduced ? 0 : lockI >= 0 ? 0.08 : 1;
      timeScale += (want - timeScale) * (1 - Math.pow(0.02, dt));
      sky.time += dt * timeScale;
      placePlanets(sky.time);

      // 2) Telescope view
      if (mode === "home" && !held) {
        target.x = sky.home.x;
        target.y = sky.home.y + Math.sin(now / 900) * 4;
      } else if (mode === "return") {
        target.x = sky.home.x;
        target.y = sky.home.y;
        if (Math.hypot(target.x - pos.x, target.y - pos.y) < 1.5) mode = "home";
      } else if (mode === "track" && !held && trackI >= 0) {
        target.x = clamp(planets[trackI].x, R * 0.6, sky.W - R * 0.6);
        target.y = clamp(planets[trackI].y, topLimit, sky.H - R * 0.6);
      }
      const k = 1 - Math.pow(held ? 0.0004 : mode === "track" ? 0.03 : 0.006, dt);
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      sky.lens.x = pos.x;
      sky.lens.y = pos.y;

      moveAsts(dt, now);

      // 3) What's in view
      const view = R / ZOOM;
      let best = -1;
      let bestD = Infinity;
      for (const p of planets) {
        const d = Math.hypot(p.x - pos.x, p.y - pos.y);
        if (d < bestD) {
          bestD = d;
          best = p.i;
        }
      }
      const keep = lockI >= 0 && Math.hypot(planets[lockI].x - pos.x, planets[lockI].y - pos.y) < view * 0.85;
      const next = keep ? lockI : bestD < view * 0.6 ? best : -1;
      if (next !== lockI) {
        lockI = next;
        setLock(next);
        dwell.clear();
        if (next >= 0 && started && !held && mode !== "home") {
          trackI = next;
          mode = "track";
        }
      }
      if (lockI >= 0 && started && !foundSet.has(lockI)) {
        const w = (dwell.get(lockI) ?? 0) + dt;
        dwell.set(lockI, w);
        if (w > 0.45) {
          foundSet.add(lockI);
          try {
            localStorage.setItem(STORE, JSON.stringify([...foundSet]));
          } catch {}
          setFound([...foundSet]);
        }
      }

      // 4) Aim the telescope at the view (the 3D astronaut reads sky.phi)
      const piv = rigToHero(PIVOT.x, PIVOT.y);
      const want2 = clamp(Math.atan2(-(pos.y - piv.y), (pos.x - piv.x) / COS_YAW), PHI_MIN, PHI_MAX);
      sky.phi += (want2 - sky.phi) * (1 - Math.pow(0.03, dt));
      const tip = rigToHero(PIVOT.x + Math.cos(sky.phi) * TUBE_FRONT, PIVOT.y + Math.sin(sky.phi) * TUBE_FRONT);
      sky.tip = tip;

      // 5) Writes (transforms only)
      for (const p of planets) {
        const d = dots.current[p.i];
        if (d) {
          d.style.transform = `translate(${p.x}px, ${p.y}px)`;
          const front = p.depth > 0;
          if (d.dataset.front !== String(front)) {
            d.dataset.front = String(front);
            d.style.zIndex = front ? "4" : "2";
          }
        }
        const lp = lensPlanets.current[p.i];
        if (lp) {
          const lx = (p.x - pos.x) * ZOOM + R;
          const ly = (p.y - pos.y) * ZOOM + R;
          const near = Math.abs(lx - R) < R + p.size && Math.abs(ly - R) < R + p.size;
          lp.style.transform = near ? `translate(${lx - p.size / 2}px, ${ly - p.size / 2}px)` : "translate(-9999px, 0)";
          if (near) {
            lp.style.zIndex = p.depth > 0 ? "4" : "2";
            const sh = shades.current[p.i];
            if (sh) sh.style.transform = `rotate(${Math.atan2(sky.sun.y - p.y, sky.sun.x - p.x) - Math.PI}rad)`;
          }
        }
      }
      E.lens.style.transform = `translate(${pos.x - R}px, ${pos.y - R}px)`;
      const sr = sky.sun.r * ZOOM;
      E.lensSun.style.transform = `translate(${(sky.sun.x - pos.x) * ZOOM + R - sr}px, ${(sky.sun.y - pos.y) * ZOOM + R - sr}px)`;
      if (Math.abs(pos.x - lastLX) > 0.05 || Math.abs(pos.y - lastLY) > 0.05) {
        lastLX = pos.x;
        lastLY = pos.y;
        drawLensStars(pos.x, pos.y);
      }
      if (frame % 8 === 0) {
        // Fake sky coordinates for the eyepiece readout
        const ra = (pos.x / sky.W) * 24;
        const dec = 90 - (pos.y / sky.H) * 180;
        E.readout.textContent = `RA ${String(Math.floor(ra)).padStart(2, "0")}h ${String(Math.floor((ra % 1) * 60)).padStart(2, "0")}m · DEC ${dec >= 0 ? "+" : "−"}${String(Math.abs(Math.round(dec))).padStart(2, "0")}°`;
      }

      // Sight line from the telescope to the view
      const vx = pos.x - tip.x;
      const vy = pos.y - tip.y;
      const dist = Math.hypot(vx, vy);
      const len = Math.max(0, dist - R * 1.08);
      E.line.style.transform = `translate(${tip.x}px, ${tip.y}px) rotate(${Math.atan2(vy, vx)}rad) scaleX(${len / 100})`;

      // Readout card beside the view
      if (lockI >= 0) {
        let hx: number;
        let hy: number;
        if (sky.mobile) {
          hx = clamp(pos.x - hudW / 2, 12, sky.W - hudW - 12);
          hy = pos.y > sky.H * 0.45 ? pos.y - R * 1.15 - hudH - 30 : pos.y + R * 1.15 + 34;
        } else {
          const right = pos.x + R * 1.15 + 28;
          hx = right + hudW < sky.W - 16 ? right : pos.x - R * 1.15 - 28 - hudW;
          hy = pos.y - hudH / 2;
        }
        hy = clamp(hy, topLimit - R * 0.3, sky.H - hudH - 12);
        E.hud.style.transform = `translate(${hx}px, ${hy}px)`;
      }
    };

    /* ---------- Input ---------- */
    const toHero = (e: PointerEvent) => ({ x: e.clientX - grab.left, y: e.clientY - grab.top });
    const start = () => {
      if (!started) {
        started = true;
        setTouched(true);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const r = hero.getBoundingClientRect();
      grab.left = r.left;
      grab.top = r.top;
      const p = toHero(e);
      held = true;
      mode = "free";
      start();
      E.lens.setPointerCapture(e.pointerId);
      grab.dx = p.x - pos.x;
      grab.dy = p.y - pos.y;
      target.x = pos.x;
      target.y = pos.y;
      doc.classList.add("lens-held");
    };
    const onMove = (e: PointerEvent) => {
      if (!held) return;
      const p = toHero(e);
      target.x = clamp(p.x - grab.dx, R * 0.6, sky.W - R * 0.6);
      target.y = clamp(p.y - grab.dy, topLimit, sky.H - R * 0.6);
    };
    const onUp = (e: PointerEvent) => {
      if (!held) return;
      held = false;
      doc.classList.remove("lens-held");
      try {
        E.lens.releasePointerCapture(e.pointerId);
      } catch {}
      if (lockI >= 0) {
        trackI = lockI;
        mode = "track";
      }
    };
    const seekNext = () => {
      // Next planet not found yet (after the current one); once all are found, just the next one.
      start();
      const n = planets.length;
      const from = trackI >= 0 ? trackI : lockI;
      let pick = -1;
      for (let j = 1; j <= n; j++) {
        const i = (((from + j) % n) + n) % n;
        if (!foundSet.has(i)) {
          pick = i;
          break;
        }
      }
      trackI = pick >= 0 ? pick : (((from + 1) % n) + n) % n;
      mode = "track";
    };
    const onKey = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 80 : 24;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      if (moves[e.key]) {
        e.preventDefault();
        start();
        if (mode !== "free") {
          mode = "free";
          target.x = pos.x;
          target.y = pos.y;
        }
        target.x = clamp(target.x + moves[e.key][0], R * 0.6, sky.W - R * 0.6);
        target.y = clamp(target.y + moves[e.key][1], topLimit, sky.H - R * 0.6);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        seekNext();
      } else if (e.key === "Home" || e.key === "Escape") {
        mode = "return";
      }
    };
    const onDbl = () => {
      mode = "return";
      trackI = -1;
    };
    const onSeek = () => seekNext();

    let resizeT = 0;
    let lastW = innerWidth;
    const onResize = () => {
      // Mobile browsers resize when the address bar hides; only re-layout for real width changes.
      if (innerWidth === lastW && sky.mobile) return;
      lastW = innerWidth;
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(measure, 150);
    };

    measure();
    placePlanets(sky.time);
    sky.phi = 2.3;
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      setLive(en.isIntersecting);
      if (visible) prev = performance.now();
    });
    io.observe(hero);

    E.lens.addEventListener("pointerdown", onDown);
    E.lens.addEventListener("pointermove", onMove);
    E.lens.addEventListener("pointerup", onUp);
    E.lens.addEventListener("pointercancel", onUp);
    E.lens.addEventListener("dblclick", onDbl);
    E.lens.addEventListener("keydown", onKey);
    window.addEventListener("sky:seek", onSeek);
    window.addEventListener("resize", onResize);
    gsap.ticker.add(tick);
    const hudObs = new ResizeObserver(measureHud);
    hudObs.observe(E.hud);

    // Load the astronaut when the browser is idle, if WebGL exists.
    let idle = 0;
    const hasGL = (() => {
      try {
        const c = document.createElement("canvas");
        return !!(c.getContext("webgl2") || c.getContext("webgl"));
      } catch {
        return false;
      }
    })();
    if (hasGL) {
      const go = () => setGl(true);
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(go, { timeout: 1500 });
      else idle = (window as Window).setTimeout(go, 600);
    }

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      hudObs.disconnect();
      window.clearTimeout(resizeT);
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      E.lens.removeEventListener("pointerdown", onDown);
      E.lens.removeEventListener("pointermove", onMove);
      E.lens.removeEventListener("pointerup", onUp);
      E.lens.removeEventListener("pointercancel", onUp);
      E.lens.removeEventListener("dblclick", onDbl);
      E.lens.removeEventListener("keydown", onKey);
      window.removeEventListener("sky:seek", onSeek);
      window.removeEventListener("resize", onResize);
      doc.classList.remove("lens-held");
    };
  }, []);

  const locked = lock >= 0 ? planets[lock] : null;
  const allFound = found.length === planets.length;

  return (
    <div ref={root} className="sky" aria-hidden={false}>
      <canvas ref={starCanvas} className="sky-stars" aria-hidden="true" />
      <svg ref={orbits} className="sky-orbits" aria-hidden="true" preserveAspectRatio="none" />
      <div ref={sun} className="sky-sun" aria-hidden="true" />

      {/* Planets, as the naked eye sees them: just bright stars */}
      {planets.map((p) => (
        <div
          key={p.title}
          ref={(n) => {
            dots.current[p.i] = n;
          }}
          className={`sky-dot ${found.includes(p.i) ? "found" : ""}`}
          style={{ "--glow": p.look.glow, "--tint": p.look.light } as React.CSSProperties}
          aria-hidden="true"
        >
          <span className="sky-dot-core" />
          <span className="sky-dot-label">{p.title}</span>
        </div>
      ))}

      {/* Falling asteroids */}
      {Array.from({ length: AST_POOL }, (_, k) => (
        <div
          key={k}
          className="ast"
          aria-hidden="true"
          ref={(n) => {
            astSky.current[k] = n;
          }}
        >
          <span className="ast-trail" />
          <span className="ast-rock" />
        </div>
      ))}

      {/* The astronaut with the telescope (3D) */}
      <div ref={box} className={`astro-box ${ready ? "ready" : ""}`} aria-hidden="true">
        {gl && <SkyScene live={live} onReady={() => setReady(true)} />}
      </div>
      <div ref={line} className={`sightline ${ready ? "ready" : ""}`} aria-hidden="true" />

      {/* What the telescope sees */}
      <div
        ref={lens}
        className="lens"
        role="button"
        tabIndex={0}
        aria-label="Telescope view. Drag it across the sky to find the six planets, one for each service. Arrow keys move it; Enter jumps to the next planet."
      >
        <div className="lens-view">
          <canvas ref={lensStars} className="lens-stars" />
          <div ref={lensSun} className="lens-sun" />
          {Array.from({ length: AST_POOL }, (_, k) => (
            <div
              key={k}
              className="ast"
              ref={(n) => {
                astLens.current[k] = n;
              }}
            >
              <span className="ast-trail" />
              <span className="ast-rock" />
            </div>
          ))}
          {planets.map((p) => (
            <div
              key={p.title}
              ref={(n) => {
                lensPlanets.current[p.i] = n;
              }}
              className="lp"
              style={
                {
                  width: p.size,
                  height: p.size,
                  "--s": `${p.size}px`,
                  "--light": p.look.light,
                  "--base": p.look.base,
                  "--dark": p.look.dark,
                  "--glow": p.look.glow,
                  "--ring": p.look.ring,
                } as React.CSSProperties
              }
            >
              {p.look.ring && <span className="lp-ring back" />}
              <span className="lp-body">
                <span className={`lp-surface ${p.look.surface}`} />
                <span
                  className="lp-shade"
                  ref={(n) => {
                    shades.current[p.i] = n;
                  }}
                />
              </span>
              {p.look.ring && <span className="lp-ring front" />}
              <span className="lp-name">{p.title}</span>
            </div>
          ))}
          <div className="lens-vignette" />
          <div className={`lens-hint ${touched ? "gone" : ""}`}>
            <span className="hand block text-[1.15em] text-ember">Drag me across the sky.</span>
            <span className="mt-1 block">Find the six planets</span>
          </div>
        </div>
        <svg className="lens-reticle" viewBox="-120 -120 240 240" aria-hidden="true">
          <g stroke="rgba(255,255,255,0.18)" strokeWidth="0.6">
            <line x1="-100" y1="0" x2="-14" y2="0" />
            <line x1="14" y1="0" x2="100" y2="0" />
            <line x1="0" y1="-100" x2="0" y2="-14" />
            <line x1="0" y1="14" x2="0" y2="100" />
          </g>
          <circle r="5" fill="none" stroke="rgba(238,92,48,0.7)" strokeWidth="0.8" />
          <g stroke="rgba(255,255,255,0.4)">
            {Array.from({ length: 72 }, (_, i) => {
              const a = (i / 72) * Math.PI * 2;
              const long = i % 6 === 0;
              const r0 = long ? 103.5 : 105.5;
              return (
                <line
                  key={i}
                  x1={Math.cos(a) * r0}
                  y1={Math.sin(a) * r0}
                  x2={Math.cos(a) * 108.5}
                  y2={Math.sin(a) * 108.5}
                  strokeWidth={long ? 0.9 : 0.5}
                />
              );
            })}
          </g>
          <path d="M0 -101 l-3.2 -6 h6.4z" fill="#ee5c30" />
        </svg>
        <span className="lens-zoom">×{ZOOM.toFixed(1)}</span>
        <span ref={readout} className="lens-readout">
          RA 00h 00m · DEC +00°
        </span>
      </div>

      {/* Readout card for the planet in view */}
      <aside ref={hud} className={`hud ${locked ? "on" : ""}`} aria-live="polite">
        {locked && (
          <>
            <div className="measure flex items-center gap-2">
              <span className="text-ember">Planet {String(locked.i + 1).padStart(2, "0")}</span>
              <span className="h-px w-5 bg-current opacity-40" />
              <span>{found.includes(locked.i) ? "Logged" : "Scanning…"}</span>
            </div>
            <h3 className="mt-3 font-display text-2xl leading-none font-semibold tracking-[-0.04em]">{locked.title}</h3>
            <p className="mt-2 text-sm leading-snug text-ink-2">{locked.body}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {locked.tags.map((t) => (
                <span key={t} className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-steel uppercase">
                  {t}
                </span>
              ))}
            </div>
            <a href="#services" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ember hover:text-ink">
              See the service <Arrow className="h-3 w-3" />
            </a>
          </>
        )}
      </aside>

      {/* Progress, under the astronaut */}
      <button
        onClick={() => window.dispatchEvent(new Event("sky:seek"))}
        title="Planets found with the telescope. Click to point it at the next one."
        className="sky-pill"
      >
        <span className={`h-2 w-2 rounded-full border border-ember ${allFound ? "bg-ember" : ""}`} />
        <span className="tabular-nums">
          {found.length}/{planets.length}
        </span>
        <span className="text-steel">{allFound ? "planets found. All of them." : "planets found"}</span>
      </button>
    </div>
  );
}
