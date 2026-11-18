"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { sky, YAW, PIVOT, TUBE_BACK } from "@/lib/sky";
import { prefersReducedMotion } from "@/lib/gsap";

/* ---------- Materials: matcaps (pre-shaded sphere images) need no lights and are very cheap ---------- */
function matcap(stops: [number, string][], hi?: { x: number; y: number; r: number; color: string } | null, rimAlpha = 0.35) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  // Light from the upper left: shift the gradient centre that way.
  const base = g.createRadialGradient(52, 48, 0, 64, 64, 66);
  stops.forEach(([o, col]) => base.addColorStop(o, col));
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  if (hi) {
    const h = g.createRadialGradient(hi.x, hi.y, 0, hi.x, hi.y, hi.r);
    h.addColorStop(0, hi.color);
    h.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = h;
    g.fillRect(0, 0, 128, 128);
  }
  // Warm rim light from the sun (right side)
  const rim = g.createRadialGradient(64, 64, 50, 64, 64, 64);
  rim.addColorStop(0, "rgba(255,140,80,0)");
  rim.addColorStop(1, `rgba(255,140,80,${rimAlpha})`);
  g.fillStyle = rim;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshMatcapMaterial({ matcap: t });
}

function useMats() {
  return useMemo(() => {
    const flagCanvas = document.createElement("canvas");
    flagCanvas.width = 256;
    flagCanvas.height = 160;
    const f = flagCanvas.getContext("2d")!;
    f.fillStyle = "#ee5c30";
    f.fillRect(0, 0, 256, 160);
    f.fillStyle = "#fff";
    f.font = "600 46px system-ui, sans-serif";
    f.textBaseline = "middle";
    f.fillText("cyoptmic.", 22, 82);
    const flagTex = new THREE.CanvasTexture(flagCanvas);
    flagTex.colorSpace = THREE.SRGBColorSpace;

    return {
      suit: matcap([[0, "#ffffff"], [0.5, "#e9e5e0"], [0.85, "#9d978f"], [1, "#5d5852"]], { x: 44, y: 38, r: 26, color: "rgba(255,255,255,0.9)" }),
      suitDark: matcap([[0, "#b9b4ae"], [0.6, "#8a847d"], [1, "#3c3833"]]),
      visor: matcap([[0, "#1a2140"], [0.55, "#0b0f22"], [0.85, "#2b2140"], [1, "#e9a94d"]], { x: 40, y: 36, r: 20, color: "rgba(255,255,255,0.85)" }),
      gold: matcap([[0, "#fff1c2"], [0.5, "#e3a743"], [1, "#6b4207"]], { x: 44, y: 38, r: 22, color: "rgba(255,255,255,0.8)" }),
      chrome: matcap([[0, "#d8d5d1"], [0.5, "#8f8b87"], [0.8, "#3a3835"], [1, "#e9e6e2"]], { x: 42, y: 36, r: 24, color: "rgba(255,255,255,0.95)" }),
      lacquer: matcap([[0, "#2a2a33"], [0.7, "#15151b"], [1, "#4a4a55"]], { x: 44, y: 34, r: 20, color: "rgba(255,255,255,0.5)" }),
      ember: matcap([[0, "#ff8a5c"], [0.6, "#e6582f"], [1, "#7a2410"]], { x: 44, y: 36, r: 22, color: "rgba(255,220,200,0.75)" }),
      glass: matcap([[0, "#3a5c9a"], [0.6, "#14213f"], [1, "#0a0f1e"]], { x: 46, y: 38, r: 18, color: "rgba(255,255,255,0.9)" }),
      moon: matcap([[0, "#c2bcb5"], [0.55, "#8a847d"], [0.85, "#45413c"], [1, "#24211f"]], { x: 40, y: 34, r: 30, color: "rgba(255,255,255,0.25)" }, 0.12),
      crater: new THREE.MeshBasicMaterial({ color: "#2b2825", transparent: true, opacity: 0.55, depthWrite: false }),
      light: new THREE.MeshBasicMaterial({ color: "#ff7a45", toneMapped: false }),
      lightOff: new THREE.MeshBasicMaterial({ color: "#5a2414", toneMapped: false }),
      flag: new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide, toneMapped: false }),
    };
  }, []);
}

/* ---------- Small helpers ---------- */
const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();

/** Place a Y-aligned mesh so it runs from a to b. */
function span(m: THREE.Object3D | null, a: THREE.Vector3, b: THREE.Vector3, stretch = false) {
  if (!m) return;
  m.position.copy(a).add(b).multiplyScalar(0.5);
  tmp.copy(b).sub(a);
  const len = tmp.length();
  m.quaternion.setFromUnitVectors(UP, tmp.normalize());
  if (stretch) m.scale.set(1, len, 1);
}

/** Two-bone IK in the rig plane: returns the middle joint (elbow / knee). */
function ik(ax: number, ay: number, tx: number, ty: number, l1: number, l2: number, pick: (x: number, y: number) => number) {
  const dx = tx - ax;
  const dy = ty - ay;
  const d = THREE.MathUtils.clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  const a = Math.atan2(dy, dx);
  const A = Math.acos(THREE.MathUtils.clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const c1 = { x: ax + Math.cos(a + A) * l1, y: ay + Math.sin(a + A) * l1 };
  const c2 = { x: ax + Math.cos(a - A) * l1, y: ay + Math.sin(a - A) * l1 };
  return pick(c1.x, c1.y) < pick(c2.x, c2.y) ? c1 : c2;
}

const MOON_R = 1.25;
const surfaceY = (x: number, z: number) => Math.sqrt(Math.max(0, MOON_R * MOON_R - x * x - z * z)) - MOON_R;

// Proportions (model units; the astronaut is about 1.9 tall)
const THIGH = 0.42;
const SHIN = 0.42;
const TORSO = 0.6;
const UPPER = 0.33;
const FORE = 0.31;

function Rig() {
  const M = useMats();
  const { size, invalidate } = useThree();
  const reduced = useMemo(() => prefersReducedMotion(), []);

  const rig = useRef<THREE.Group>(null);
  const tube = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const hipRing = useRef<THREE.Mesh>(null);
  const limbs = useRef<Record<string, THREE.Mesh | null>>({});
  const blink = useRef<THREE.Mesh>(null);
  const flag = useRef<THREE.Group>(null);
  const L = (k: string) => (n: THREE.Mesh | null) => {
    limbs.current[k] = n;
  };

  // Tripod legs and moon craters never move: work them out once.
  const tripod = useMemo(() => {
    const top = new THREE.Vector3(PIVOT.x, PIVOT.y - 0.12, 0);
    const feet = [
      [PIVOT.x - 0.3, 0.2],
      [PIVOT.x + 0.28, 0.24],
      [PIVOT.x - 0.02, -0.32],
    ].map(([x, z]) => new THREE.Vector3(x, surfaceY(x, z) + 0.02, z));
    return { top, feet };
  }, []);
  const craters = useMemo(
    () =>
      [
        [-0.55, -0.45, 0.24],
        [0.6, -0.9, 0.18],
        [-0.15, -1.15, 0.13],
        [0.95, -0.35, 0.12],
        [-0.95, -0.95, 0.15],
        [0.2, -0.5, 0.09],
      ].map(([x, y, r]) => {
        // Put each crater on the front of the sphere, facing out.
        const cy = y - -MOON_R; // relative to moon centre
        const z = Math.sqrt(Math.max(0.01, MOON_R * MOON_R - x * x - cy * cy));
        const n = new THREE.Vector3(x, cy, z).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
        const p = n.clone().multiplyScalar(MOON_R + 0.004).add(new THREE.Vector3(0, -MOON_R, 0));
        return { p, q, r };
      }),
    []
  );

  const v = useMemo(
    () => ({
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      c: new THREE.Vector3(),
    }),
    []
  );

  useEffect(() => {
    // Draw tripod legs once
    tripod.feet.forEach((f, i) => span(limbs.current[`tri${i}`], tripod.top, f, true));
    invalidate();
  }, [tripod, invalidate]);

  useFrame(({ clock }) => {
    const g = rig.current;
    if (!g) return;
    const r = sky.rig;
    const t = reduced ? 0 : clock.elapsedTime;
    g.position.set(r.ox - size.width / 2, size.height / 2 - r.oy, 0);
    g.scale.setScalar(r.s);

    // Telescope
    const phi = sky.phi;
    const dx = Math.cos(phi);
    const dy = Math.sin(phi);
    if (tube.current) tube.current.rotation.z = phi;

    // Where the helmet needs to be: just behind the eyepiece, looking down the tube.
    const ex = PIVOT.x - dx * (TUBE_BACK + 0.05);
    const ey = PIVOT.y - dy * (TUBE_BACK + 0.05);
    const hx = ex - dx * 0.27;
    const hy = ey - dy * 0.27;

    // Hips shift and drop so the head can reach; the chest breathes.
    const breathe = Math.sin(t * 1.7) * 0.012;
    const hipX = 0.12 + THREE.MathUtils.clamp(hx * 0.35, -0.2, 0.05);
    const reach = TORSO + 0.24;
    let hipY = 0.8;
    const d0 = Math.hypot(hx - hipX, hy - hipY);
    hipY -= THREE.MathUtils.clamp(reach - d0, 0, 0.26);
    let lean = Math.atan2(-(hx - hipX), hy - hipY); // radians from vertical, + leans forward (−x)
    lean = THREE.MathUtils.clamp(lean, -0.2, 1.0);
    const ux = -Math.sin(lean);
    const uy = Math.cos(lean);
    const nx = hipX + ux * (TORSO + breathe);
    const ny = hipY + uy * (TORSO + breathe);

    if (torso.current) {
      torso.current.position.set(hipX, hipY, 0);
      torso.current.rotation.z = lean;
    }
    if (hipRing.current) hipRing.current.position.set(hipX, hipY + 0.02, 0);
    if (head.current) {
      head.current.position.set(nx + ux * 0.25, ny + uy * 0.25, 0);
      // Visor (−x) points along the tube.
      const want = phi - Math.PI;
      head.current.rotation.z = THREE.MathUtils.clamp(want, lean - 0.9, lean + 0.6) + Math.sin(t * 0.6) * 0.015;
    }

    // Legs: feet planted, knees bend forward
    const legs = [
      { k: "l", z: 0.13, fx: 0.0 },
      { k: "r", z: -0.13, fx: 0.24 },
    ];
    for (const leg of legs) {
      const fy = surfaceY(leg.fx, leg.z) + 0.09;
      const knee = ik(hipX, hipY, leg.fx, fy, THIGH, SHIN, (x) => x);
      v.a.set(hipX, hipY, leg.z);
      v.b.set(knee.x, knee.y, leg.z);
      v.c.set(leg.fx, fy, leg.z);
      span(limbs.current[`thigh${leg.k}`], v.a, v.b);
      span(limbs.current[`shin${leg.k}`], v.b, v.c);
      limbs.current[`boot${leg.k}`]?.position.set(leg.fx - 0.05, fy - 0.03, leg.z);
    }

    // Arms: near hand on the focuser, far hand steadying the tube
    const px = -dy;
    const py = dx;
    const arms = [
      { k: "l", z: 0.27, at: -0.16, off: -0.11, hz: 0.12 },
      { k: "r", z: -0.27, at: 0.32, off: -0.1, hz: -0.1 },
    ];
    for (const arm of arms) {
      const sx = nx - ux * 0.1;
      const sy = ny - uy * 0.1;
      const tx = PIVOT.x + dx * arm.at + px * arm.off;
      const ty = PIVOT.y + dy * arm.at + py * arm.off;
      const el = ik(sx, sy, tx, ty, UPPER, FORE, (_, y) => y);
      const ang = Math.atan2(ty - el.y, tx - el.x);
      const hx2 = el.x + Math.cos(ang) * FORE;
      const hy2 = el.y + Math.sin(ang) * FORE;
      v.a.set(sx, sy, arm.z);
      v.b.set(el.x, el.y, (arm.z + arm.hz) / 2 + (arm.z > 0 ? 0.05 : -0.05));
      v.c.set(hx2, hy2, arm.hz);
      span(limbs.current[`upper${arm.k}`], v.a, v.b);
      span(limbs.current[`fore${arm.k}`], v.b, v.c);
      limbs.current[`shoulder${arm.k}`]?.position.copy(v.a);
      limbs.current[`glove${arm.k}`]?.position.copy(v.c);
    }

    // Backpack light blinks; the flag sways
    if (blink.current) blink.current.material = (t % 2.2) < 0.18 ? M.lightOff : M.light;
    if (flag.current) flag.current.rotation.y = Math.sin(t * 1.3) * 0.16 + 0.15;
  });

  const limb = (k: string, len: number, rad: number, mat: THREE.Material) => (
    <mesh key={k} ref={L(k)} material={mat}>
      <capsuleGeometry args={[rad, len, 6, 14]} />
    </mesh>
  );

  return (
    <group ref={rig} rotation={[0.08, YAW, 0]}>
      {/* Moon */}
      <mesh position={[0, -MOON_R, 0]} material={M.moon}>
        <sphereGeometry args={[MOON_R, 48, 32]} />
      </mesh>
      {craters.map((c, i) => (
        <mesh key={i} position={c.p} quaternion={c.q} material={M.crater}>
          <circleGeometry args={[c.r, 24]} />
        </mesh>
      ))}

      {/* Flag */}
      <mesh position={[0.82, surfaceY(0.82, -0.25) + 0.62, -0.25]} material={M.chrome}>
        <cylinderGeometry args={[0.014, 0.014, 1.3, 8]} />
      </mesh>
      <group ref={flag} position={[0.82, surfaceY(0.82, -0.25) + 1.1, -0.25]}>
        <mesh position={[0.27, 0, 0]} material={M.flag}>
          <planeGeometry args={[0.52, 0.32]} />
        </mesh>
      </group>

      {/* Tripod */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={L(`tri${i}`)} material={M.lacquer}>
          <cylinderGeometry args={[0.022, 0.016, 1, 8]} />
        </mesh>
      ))}
      <mesh position={[PIVOT.x, PIVOT.y - 0.08, 0]} material={M.chrome}>
        <cylinderGeometry args={[0.07, 0.09, 0.12, 16]} />
      </mesh>

      {/* Telescope: points along +x, rotated to sky.phi around the pivot */}
      <group ref={tube} position={[PIVOT.x, PIVOT.y, 0]}>
        <mesh position={[0.28, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.suit}>
          <cylinderGeometry args={[0.085, 0.085, 1.12, 24]} />
        </mesh>
        <mesh position={[0.92, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.lacquer}>
          <cylinderGeometry args={[0.105, 0.095, 0.22, 24]} />
        </mesh>
        <mesh position={[1.031, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.glass}>
          <cylinderGeometry args={[0.088, 0.088, 0.01, 24]} />
        </mesh>
        <mesh position={[0.62, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.ember}>
          <cylinderGeometry args={[0.09, 0.09, 0.05, 24]} />
        </mesh>
        <mesh position={[-0.33, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.chrome}>
          <cylinderGeometry args={[0.05, 0.06, 0.12, 16]} />
        </mesh>
        <mesh position={[-0.42, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.lacquer}>
          <cylinderGeometry args={[0.035, 0.04, 0.09, 12]} />
        </mesh>
        <mesh position={[0.18, 0.13, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.lacquer}>
          <cylinderGeometry args={[0.028, 0.028, 0.34, 12]} />
        </mesh>
        <mesh position={[0.0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.chrome}>
          <cylinderGeometry args={[0.04, 0.04, 0.24, 12]} />
        </mesh>
      </group>

      {/* Astronaut */}
      {limb("thighl", THIGH, 0.115, M.suit)}
      {limb("shinl", SHIN, 0.105, M.suit)}
      {limb("thighr", THIGH, 0.115, M.suitDark)}
      {limb("shinr", SHIN, 0.105, M.suitDark)}
      {["l", "r"].map((k) => (
        <mesh key={k} ref={L(`boot${k}`)} scale={[1.25, 0.6, 0.95]} material={k === "l" ? M.suitDark : M.lacquer}>
          <sphereGeometry args={[0.13, 16, 12]} />
        </mesh>
      ))}
      <mesh ref={hipRing} rotation={[0, 0, 0]} material={M.suitDark}>
        <cylinderGeometry args={[0.235, 0.235, 0.1, 20]} />
      </mesh>

      <group ref={torso}>
        <mesh position={[0, TORSO / 2, 0]} material={M.suit}>
          <capsuleGeometry args={[0.235, TORSO * 0.55, 8, 20]} />
        </mesh>
        {/* Chest panel */}
        <mesh position={[-0.2, TORSO * 0.55, 0.06]} rotation={[0, -0.9, 0]} material={M.suitDark}>
          <boxGeometry args={[0.04, 0.16, 0.2]} />
        </mesh>
        <mesh position={[-0.225, TORSO * 0.58, 0.1]} material={M.ember}>
          <sphereGeometry args={[0.022, 10, 8]} />
        </mesh>
        <mesh position={[-0.22, TORSO * 0.5, 0.04]} material={M.gold}>
          <sphereGeometry args={[0.018, 10, 8]} />
        </mesh>
        {/* Backpack */}
        <mesh position={[0.28, TORSO * 0.55, 0]} material={M.suit}>
          <boxGeometry args={[0.24, 0.56, 0.44]} />
        </mesh>
        <mesh position={[0.41, TORSO * 0.55, 0]} material={M.suitDark}>
          <boxGeometry args={[0.03, 0.4, 0.3]} />
        </mesh>
        {/* Antenna with a blinking light */}
        <mesh position={[0.34, TORSO * 0.55 + 0.42, -0.12]} material={M.chrome}>
          <cylinderGeometry args={[0.008, 0.008, 0.3, 6]} />
        </mesh>
        <mesh ref={blink} position={[0.34, TORSO * 0.55 + 0.58, -0.12]} material={M.light}>
          <sphereGeometry args={[0.03, 10, 8]} />
        </mesh>
      </group>

      <group ref={head}>
        <mesh material={M.suit}>
          <sphereGeometry args={[0.27, 32, 24]} />
        </mesh>
        <mesh position={[-0.105, 0.0, 0]} scale={[0.72, 0.82, 0.92]} material={M.visor}>
          <sphereGeometry args={[0.24, 32, 24]} />
        </mesh>
        <mesh position={[-0.13, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.92, 0.82, 1]} material={M.gold}>
          <torusGeometry args={[0.215, 0.018, 8, 40]} />
        </mesh>
        {[0.26, -0.26].map((z) => (
          <mesh key={z} position={[0.02, 0, z]} rotation={[Math.PI / 2, 0, 0]} material={M.suitDark}>
            <cylinderGeometry args={[0.075, 0.075, 0.06, 16]} />
          </mesh>
        ))}
        <mesh position={[0.02, 0.2, 0.18]} rotation={[0.6, 0, 0]} material={M.chrome}>
          <cylinderGeometry args={[0.03, 0.03, 0.08, 10]} />
        </mesh>
      </group>

      {["l", "r"].map((k) => (
        <group key={k}>
          <mesh ref={L(`shoulder${k}`)} material={k === "l" ? M.suit : M.suitDark}>
            <sphereGeometry args={[0.11, 16, 12]} />
          </mesh>
          {limb(`upper${k}`, UPPER - 0.06, 0.085, k === "l" ? M.suit : M.suitDark)}
          {limb(`fore${k}`, FORE - 0.06, 0.08, k === "l" ? M.suit : M.suitDark)}
          <mesh ref={L(`glove${k}`)} material={k === "l" ? M.ember : M.suitDark}>
            <sphereGeometry args={[0.085, 14, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Ready({ onReady }: { onReady: () => void }) {
  const n = useRef(0);
  useFrame(() => {
    if (n.current++ === 2) onReady();
  });
  return null;
}

export default function SkyScene({ live, onReady }: { live: boolean; onReady: () => void }) {
  return (
    <Canvas
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      frameloop={live ? "always" : "never"}
      orthographic
      camera={{ position: [0, 0, 1000], zoom: 1, near: 0.1, far: 4000 }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
    >
      <Rig />
      <Ready onReady={onReady} />
    </Canvas>
  );
}
