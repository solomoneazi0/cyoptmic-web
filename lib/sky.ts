// Shared, mutable state for the hero sky. Written by <Sky/> every frame, read by the 3D astronaut.
// All positions are in hero pixels (0,0 = top-left of the hero section, y down).
import { services } from "./content";

export type Look = {
  light: string;
  base: string;
  dark: string;
  glow: string;
  surface: "gas" | "clouds" | "rock";
  ring?: string;
  /** Diameter through the telescope, px (desktop). */
  size: number;
};

/** One planet per service. Order matches `services`. */
const LOOKS: Look[] = [
  { light: "#cfeaff", base: "#3f8fe0", dark: "#0b2557", glow: "rgba(80,160,255,0.55)", surface: "clouds", size: 46 },
  { light: "#ffd6bd", base: "#e8663a", dark: "#3d1206", glow: "rgba(238,96,51,0.6)", surface: "rock", size: 36 },
  { light: "#f1d9ff", base: "#a466e6", dark: "#250c45", glow: "rgba(170,110,255,0.55)", surface: "gas", size: 54 },
  { light: "#fff0c2", base: "#e3a743", dark: "#432805", glow: "rgba(240,190,90,0.55)", surface: "gas", ring: "#f3d79a", size: 50 },
  { light: "#e9fffd", base: "#69d0ca", dark: "#0b3a40", glow: "rgba(110,220,215,0.5)", surface: "rock", ring: "#c4f3ef", size: 40 },
  { light: "#dcffd8", base: "#55b567", dark: "#0c3014", glow: "rgba(110,210,130,0.5)", surface: "clouds", size: 38 },
];
/** Orbit size as a fraction of the largest orbit, and seconds per lap. */
const ORBIT = [0.25, 0.37, 0.5, 0.63, 0.78, 0.94];
const PERIOD = [44, 58, 76, 96, 122, 150];

export type Planet = (typeof services)[number] & {
  i: number;
  look: Look;
  f: number;
  period: number;
  phase: number;
  x: number;
  y: number;
  /** -1 behind the sun's plane, +1 in front of it. */
  depth: number;
  size: number;
};

export const planets: Planet[] = services.map((s, i) => ({
  ...s,
  i,
  look: LOOKS[i],
  f: ORBIT[i],
  period: PERIOD[i],
  phase: 0.6 + i * 2.15,
  x: 0,
  y: 0,
  depth: 0,
  size: LOOKS[i].size,
}));

export type Star = { x: number; y: number; r: number; a: number; c: string };

export const sky = {
  W: 1440,
  H: 900,
  mobile: false,
  sun: { x: 0, y: 0, r: 24 },
  orbit: { base: 400, flat: 0.3, rot: -0.17 },
  stars: [] as Star[],
  lens: { x: 0, y: 0, r: 130 },
  home: { x: 0, y: 0 },
  /** Telescope rig: `s` px per model unit; box is the 3D canvas, (ox, oy) the astronaut's feet inside it. */
  rig: { s: 76, boxX: 0, boxY: 0, boxW: 320, boxH: 440, ox: 200, oy: 300 },
  /** Telescope angle in the rig plane (radians, 0 = pointing right, PI/2 = straight up). */
  phi: 2.3,
  tip: { x: 0, y: 0 },
  time: 0,
};

export const ZOOM = 3;
/** The rig is turned this much around Y so we see the astronaut three-quarters on. */
export const YAW = 0.5;
export const COS_YAW = Math.cos(YAW);
/** Telescope pivot (top of the tripod) in model units; feet are at (0, 0). */
export const PIVOT = { x: -0.62, y: 1.86 };
export const TUBE_FRONT = 1.02;
export const TUBE_BACK = 0.42;
export const PHI_MIN = 1.62;
export const PHI_MAX = 3.02;

/** Model units (rig plane, y up) → hero pixels. */
export function rigToHero(x: number, y: number) {
  const r = sky.rig;
  return { x: r.boxX + r.ox + x * COS_YAW * r.s, y: r.boxY + r.oy - y * r.s };
}

export function layout(W: number, H: number, lensR: number) {
  const mobile = W < 768;
  sky.W = W;
  sky.H = H;
  sky.mobile = mobile;
  sky.lens.r = lensR;
  const short = Math.min(W, H);

  if (mobile) {
    sky.sun = { x: W * 0.44, y: H * 0.25, r: Math.round(Math.max(14, short * 0.04)) };
    sky.orbit = { base: W * 0.5, flat: 0.42, rot: -0.2 };
    const s = Math.max(30, Math.min(42, H * 0.046));
    const boxW = s * 3.4;
    const boxH = s * 5.8;
    sky.rig = { s, boxW, boxH, boxX: W - boxW + s * 0.15, boxY: H * 0.34 - s * 3.15, ox: s * 1.75, oy: s * 3.15 };
    sky.home = { x: W * 0.32, y: H * 0.2 };
  } else {
    sky.sun = { x: W * 0.6, y: H * 0.34, r: Math.round(Math.min(34, Math.max(20, short * 0.03))) };
    sky.orbit = { base: Math.min(W * 0.37, H * 0.95), flat: 0.3, rot: -0.17 };
    const s = Math.max(60, Math.min(112, Math.min(H * 0.112, W * 0.072)));
    const boxW = s * 3.4;
    const boxH = s * 5.8;
    sky.rig = { s, boxW, boxH, boxX: W - boxW - W * 0.03, boxY: H - boxH - H * 0.06, ox: s * 1.75, oy: s * 3.15 };
    sky.home = { x: W * 0.47, y: H * 0.25 };
  }
  for (const p of planets) p.size = Math.round(p.look.size * (mobile ? 0.85 : 1.25));
}

export function placePlanets(t: number) {
  const { sun, orbit } = sky;
  const c = Math.cos(orbit.rot);
  const s = Math.sin(orbit.rot);
  for (const p of planets) {
    const a = orbit.base * p.f;
    const b = a * orbit.flat;
    const th = p.phase + (t / p.period) * Math.PI * 2;
    const ex = Math.cos(th) * a;
    const ey = Math.sin(th) * b;
    p.x = sun.x + ex * c - ey * s;
    p.y = sun.y + ex * s + ey * c;
    p.depth = Math.sin(th);
  }
}

/** Small seeded random, so the star field is the same on every load. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeStars(W: number, H: number) {
  const r = rng(7);
  const n = Math.round((W * H) / 2100);
  const out: Star[] = [];
  for (let i = 0; i < n; i++) {
    const k = r();
    out.push({
      x: r() * W,
      y: r() * H,
      r: 0.35 + Math.pow(r(), 3) * 1.25,
      a: 0.25 + r() * 0.75,
      c: k < 0.08 ? "255,214,190" : k < 0.16 ? "200,220,255" : "255,255,255",
    });
  }
  sky.stars = out;
  return out;
}
