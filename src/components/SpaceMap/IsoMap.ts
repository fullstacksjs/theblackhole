import * as THREE from "three";

import { isActive, type Link, type PlanetStatus } from "#domain/map.ts";

/** Where a planet sits: tier 0 is the centre, tiers 1-4 are rings within the planet's sector. */
export interface IsoMapPlanet {
  id: string;
  sector: number;
  tier: number;
  slot: number;
}

export interface IsoMapOptions {
  planets: readonly IsoMapPlanet[];
  links: readonly Link[];
  sectorCount: number;
  onPick: (id: string | null) => void;
}

// Sphere grey, orbit ring, dashed ring, label and fog clearing per status.
interface Look {
  c: number;
  r: number;
  d: number;
  l: number;
  f: number;
}

const LIT: Look = { c: 0.94, r: 0.5, d: 0, l: 1, f: 1 };
const LOOKS: Record<PlanetStatus, Look> = {
  anchor: LIT,
  charted: LIT,
  fading: { c: 0.4, r: 0.22, d: 0, l: 0.9, f: 0.85 },
  "in-reach": { c: 0.13, r: 0, d: 0.8, l: 0.9, f: 0.4 },
  uncharted: { c: 0.1, r: 0, d: 0, l: 0, f: 0 },
};

const CFG = {
  bg: 0x0a0a0a,
  dist: 52,
  phi: 0.9553,
  theta: 0.7854,
  dMin: 9,
  dMax: 110,
  fogMid: 0x1c1c1c,
  fogInk: 0x3a3a3a,
  ditherPx: 2,
  revealR: 8.5,
  ringK: 2,
  tube: 0xfafafa,
  tubeMid: 0x6b6b6b,
  tubeInk: 0x2e2e2e,
  tubeK: 0.35,
  tubePx: 1,
  sectorRadius: 37.5,
};

const TIER_RADIUS = [0, 9, 17.5, 26, 34];
const TIER_SPREAD = [0, 0, 20, 22, 0];

interface PlanetView {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  ring: THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
  ringMat: THREE.MeshBasicMaterial | null;
  hole: { uT: THREE.IUniform<number>; uOpacity: THREE.IUniform<number> } | null;
  dash: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  label: HTMLElement | null;
  labelShown: boolean;
  vis: Look;
  tgt: Look;
  spin: number;
}

interface TubeUniforms {
  [uniform: string]: THREE.IUniform;
  uA: THREE.IUniform<THREE.Vector3>;
  uB: THREE.IUniform<THREE.Vector3>;
  uGrow: THREE.IUniform<number>;
  uW: THREE.IUniform<number>;
  uT: THREE.IUniform<number>;
  uOp: THREE.IUniform<number>;
  uTip: THREE.IUniform<number>;
  uArr: THREE.IUniform<number>;
  uPix: THREE.IUniform<number>;
  uK: THREE.IUniform<number>;
}

interface LinkView {
  ia: number;
  ib: number;
  tube: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  U: TubeUniforms;
  grow: number;
  gTgt: number;
  op: number;
  arrive: number;
  from: number;
  off: number;
  s: THREE.Vector3;
  e: THREE.Vector3;
}

interface Screen {
  x: number;
  y: number;
  r: number;
}

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function dashTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const x = c.getContext("2d")!;
  x.strokeStyle = "#fff";
  x.lineWidth = 3;
  x.setLineDash([10, 12]);
  x.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    x.lineTo(128 + Math.cos(a) * 120, 128 + Math.sin(a) * 120);
  }
  x.closePath();
  x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

/**
 * Isometric WebGL renderer for the personal map. It owns the scene, camera and pointer navigation,
 * and only animates towards the statuses it is given. Label elements belong to the caller; the
 * renderer positions them over their planets every frame.
 */
export class IsoMap {
  private readonly el: HTMLElement;
  private readonly o: IsoMapOptions;
  private readonly ids: string[];
  private readonly ix = new Map<string, number>();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly cv: HTMLCanvasElement;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 900);
  private readonly flatQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  private readonly dashTex = dashTexture();
  // Every planet is small enough for the coarsest icosphere: 20 flat faces.
  private readonly sphere = new THREE.IcosahedronGeometry(1, 0);
  private readonly projected = new THREE.Vector3();
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private readonly events = new AbortController();
  private readonly P: THREE.Vector3[] = [];
  private readonly baseRad: number[] = [];
  private Rad: number[] = [];
  private readonly sectorPoints: THREE.Vector3[];
  private readonly sectorLabels: (HTMLElement | null)[];
  private readonly N: PlanetView[];
  private readonly E: LinkView[];
  private readonly cam = { target: new THREE.Vector3(), dist: CFG.dist };
  private readonly goal = { target: new THREE.Vector3(), dist: CFG.dist };
  private readonly off = { x: 0, y: 0 };
  private offGoal = { x: 0, y: 0 };
  private revealR = CFG.revealR;
  private front = Infinity;
  private wanted: Record<string, PlanetStatus> = {};
  private fogU!: {
    uN: THREE.IUniform<THREE.Vector3[]>;
    uT: THREE.IUniform<number>;
    uPix: THREE.IUniform<number>;
    uBg: THREE.IUniform<THREE.Color>;
    uMid: THREE.IUniform<THREE.Color>;
    uInk: THREE.IUniform<THREE.Color>;
  };
  private fogMesh!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private st: Record<string, PlanetStatus> | null = null;
  private hover = -1;
  private sel = -1;
  private drag: { x: number; y: number; sx: number; sy: number; moved: boolean } | null = null;
  private t = 0;
  private lt = 0;
  private w = 0;
  private h = 0;
  private raf = 0;

  constructor(el: HTMLElement, options: IsoMapOptions) {
    // The shaders write sRGB greys directly, as the prototype did on three r149.
    THREE.ColorManagement.enabled = false;
    this.el = el;
    this.o = options;
    this.ids = options.planets.map((p) => p.id);
    this.ids.forEach((id, i) => this.ix.set(id, i));

    const R = new THREE.WebGLRenderer({ antialias: true });
    this.renderer = R;
    R.outputColorSpace = THREE.LinearSRGBColorSpace;
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    R.setClearColor(CFG.bg, 1);
    this.cv = R.domElement;
    this.cv.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none;";
    el.append(this.cv);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.2 * Math.PI));
    const key = new THREE.DirectionalLight(0xffffff, 0.85 * Math.PI);
    key.position.set(-5, 14, 15);
    this.scene.add(key);

    this.layout();
    this.sectorPoints = Array.from({ length: options.sectorCount }, (_, i) => {
      const a = this.sectorAngle(i);
      return new THREE.Vector3(Math.cos(a) * CFG.sectorRadius, 0, Math.sin(a) * CFG.sectorRadius);
    });
    this.sectorLabels = this.sectorPoints.map(() => null);
    this.N = this.planets();
    this.E = this.tubes();
    this.fog();
    this.listen();
    this.raf = requestAnimationFrame(this.tick);
  }

  attachLabel(id: string, label: HTMLElement | null) {
    const p = this.N[this.ix.get(id) ?? -1];
    if (!p) return;
    p.label = label;
    p.labelShown = false;
    if (label) label.style.opacity = "0";
  }

  attachSectorLabel(index: number, label: HTMLElement | null) {
    if (index < this.sectorLabels.length) this.sectorLabels[index] = label;
  }

  setStatus(statuses: Record<string, PlanetStatus>, selectedId: string | null) {
    this.wanted = statuses;
    this.sel = selectedId == null ? -1 : (this.ix.get(selectedId) ?? -1);
    this.apply();
  }

  /**
   * Keeps every planet farther than `radius` from the centre in the fog. Each one takes on its
   * status as the front passes it, so a growing front reveals the map from The Craft outwards.
   */
  setRevealFront(radius: number) {
    this.front = radius;
    if (this.st) this.apply();
  }

  private apply() {
    const first = !this.st;
    const prev = this.st ?? {};
    const statuses = Number.isFinite(this.front)
      ? Object.fromEntries(
          this.ids.map((id, i) => [
            id,
            this.P[i].length() <= this.front ? (this.wanted[id] ?? "uncharted") : "uncharted",
          ]),
        )
      : this.wanted;
    this.st = statuses;
    this.N.forEach((p, i) => {
      Object.assign(p.tgt, LOOKS[statuses[this.ids[i]] ?? "uncharted"]);
      if (first) Object.assign(p.vis, p.tgt);
    });
    for (const e of this.E) {
      const active = isActive(statuses[this.ids[e.ia]]) && isActive(statuses[this.ids[e.ib]]);
      if (active && !e.gTgt) {
        // The tunnel grows out of the endpoint that was already active.
        const wasB = isActive(prev[this.ids[e.ib]]);
        const wasA = isActive(prev[this.ids[e.ia]]);
        this.orient(e, first || wasA || !wasB ? e.ia : e.ib);
        e.grow = first ? 1 : 0;
        if (first) e.op = 0.8;
      }
      e.gTgt = active ? 1 : 0;
    }
  }

  /** Scales every planet, with the links docked to them. */
  setPlanetScale(k: number) {
    this.Rad = this.baseRad.map((r) => r * k);
    this.N.forEach((p, i) => p.mesh.scale.setScalar(this.Rad[i]));
    for (const e of this.E) if (e.from >= 0) this.orient(e, e.from);
  }

  /** Scales how far the fog clears around a known planet. */
  setRevealScale(k: number) {
    this.revealR = CFG.revealR * k;
  }

  /** Eases the camera towards a zoom distance, or cuts to it when `instant`. */
  setZoom(dist: number, { instant = false } = {}) {
    this.goal.dist = dist;
    if (instant) this.cam.dist = dist;
  }

  /** Offsets the view in pixels, eased like every other camera move. */
  shake(x: number, y: number) {
    this.offGoal = { x, y };
  }

  focus(id: string) {
    const i = this.ix.get(id);
    if (i == null) return;
    this.goal.target.copy(this.P[i]);
    this.goal.dist = this.Rad[i] * 8 + 12;
    this.offGoal = { x: 0, y: 90 };
  }

  overview() {
    this.goal.target.set(0, 0, 0);
    this.goal.dist = CFG.dist;
    this.offGoal = { x: 0, y: 0 };
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.events.abort();
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    });
    this.dashTex.dispose();
    this.renderer.dispose();
    this.cv.remove();
  }

  private sectorAngle(sector: number) {
    return ((sector * 360) / this.o.sectorCount - 90) * (Math.PI / 180);
  }

  private layout() {
    const r = rng(7);
    for (const n of this.o.planets) {
      const p = new THREE.Vector3();
      if (n.tier > 0) {
        const ang =
          this.sectorAngle(n.sector) +
          (n.slot * TIER_SPREAD[n.tier] * Math.PI) / 180 +
          (r() - 0.5) * 0.14;
        const rad = TIER_RADIUS[n.tier] + (r() - 0.5) * 2.2;
        p.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
      }
      this.P.push(p);
      this.baseRad.push(
        n.tier === 0 ? 0.3 : n.tier === 1 ? 0.17 : n.tier === 4 ? 0.23 : 0.1 + r() * 0.05,
      );
    }
    this.Rad = [...this.baseRad];
  }

  private planets(): PlanetView[] {
    const r = rng(3);
    const ringG = new THREE.RingGeometry(1.42, 1.47, 6);
    const plane = new THREE.PlaneGeometry(2, 2);
    const fx = { transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide };
    return this.o.planets.map((n, i) => {
      const blackHole = n.tier === 0;
      const mesh = new THREE.Mesh(
        this.sphere,
        new THREE.MeshStandardMaterial({
          color: 0x0d0d0d,
          roughness: 0.92,
          metalness: 0,
          flatShading: true,
        }),
      );
      mesh.scale.setScalar(this.Rad[i]);
      mesh.position.copy(this.P[i]);
      mesh.visible = !blackHole;
      const ringMat = blackHole ? null : new THREE.MeshBasicMaterial({ color: 0xffffff, ...fx });
      const hole = blackHole ? { uT: { value: 0 }, uOpacity: { value: 0 } } : null;
      const ring: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = hole
        ? this.blackHole(hole)
        : new THREE.Mesh(ringG, ringMat!);
      ring.position.copy(this.P[i]);
      ring.quaternion.copy(this.flatQ);
      const dash = new THREE.Mesh(
        plane,
        new THREE.MeshBasicMaterial({ map: this.dashTex, color: 0xffffff, ...fx }),
      );
      dash.position.copy(this.P[i]);
      this.scene.add(mesh, ring, dash);
      const hidden = { c: 0.05, r: 0, d: 0, l: 0, f: 0 };
      return {
        mesh,
        ring,
        ringMat,
        hole,
        dash,
        label: null,
        labelShown: false,
        vis: { ...hidden },
        tgt: { ...hidden },
        spin: (r() - 0.5) * 0.6,
      };
    });
  }

  // The Craft: no sphere, just a flat disk in the ground plane, so the horizon reads as a black oval.
  private blackHole(uniforms: NonNullable<PlanetView["hole"]>) {
    const disk = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms,
        vertexShader: /* glsl */ `
          varying vec2 vP;
          void main() {
            vP = position.xy;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uT, uOpacity;
          varying vec2 vP;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.0), f.x), f.y);
          }
          void main() {
            float r = length(vP), a = atan(vP.y, vP.x);
            float outside = smoothstep(0.98, 1.02, r);
            float fade = 1.0 - smoothstep(1.65, 2.85, r);
            // Different orbital speeds shear the light into rotating spiral trails.
            float orbit = a - uT * 0.38 / max(r, 0.8) + r * 3.8;
            vec2 flow = vec2(cos(orbit), sin(orbit));
            float cloud = noise(flow * 4.0 + r * 7.0) * 0.65 + noise(flow * 13.0 - r * 18.0) * 0.35;
            float filaments = pow(0.5 + 0.5 * sin(r * 65.0 + cloud * 9.0 + sin(orbit * 3.0) * 2.0), 8.0);
            float arcs = pow(0.5 + 0.5 * sin(orbit * 3.0 + cloud * 2.0), 5.0);
            float rim = exp(-pow((r - 1.03) / 0.03, 2.0));
            float outerRing = exp(-pow((r - 1.66 - cloud * 0.06) / 0.045, 2.0));
            float wisps = filaments * (0.12 + arcs * 0.88) * fade;
            float heat = pow(0.5 + 0.5 * sin(orbit + r * 2.0), 3.0);
            float l = 0.18 * (0.18 + cloud * 0.45) * fade + mix(0.42, 0.98, heat) * wisps * 0.7
                    + 0.98 * (rim * (0.55 + arcs * 0.45) + outerRing * (0.1 + heat * 0.45));
            float alpha = (1.0 - outside) + outside * max(fade * (0.25 + cloud * 0.5 + wisps), rim);
            gl_FragColor = vec4(vec3(l * outside), clamp(alpha, 0.0, 1.0) * uOpacity);
          }`,
      }),
    );
    disk.renderOrder = 6;
    return disk;
  }

  // Light tunnel: a camera-facing ribbon shaded like a glass tube (crisp walls, core beam, a comet
  // running between the ends) with flared, glowing mouths. Glow is quantized to the fog's grey steps
  // with the same Bayer dither.
  private tubes(): LinkView[] {
    const r = rng(17);
    const HALO = 2.4;
    const tubeG = new THREE.PlaneGeometry(1, 2, 48, 1);
    return this.o.links.flatMap(([a, b]) => {
      const ia = this.ix.get(a);
      const ib = this.ix.get(b);
      if (ia == null || ib == null) return [];
      const U: TubeUniforms = {
        uA: { value: new THREE.Vector3() },
        uB: { value: new THREE.Vector3() },
        uGrow: { value: 0 },
        uW: { value: 0.12 },
        uT: { value: 0 },
        uOp: { value: 0 },
        uTip: { value: 0 },
        uArr: { value: 0 },
        uPix: { value: 1 },
        uK: { value: CFG.tubeK },
        uHi: { value: new THREE.Color(CFG.tube) },
        uMid: { value: new THREE.Color(CFG.tubeMid) },
        uInk: { value: new THREE.Color(CFG.tubeInk) },
      };
      const tube = new THREE.Mesh(
        tubeG,
        new THREE.ShaderMaterial({
          uniforms: U,
          defines: { HALO: HALO.toFixed(2) },
          transparent: true,
          depthWrite: false,
          vertexShader: /* glsl */ `
            uniform vec3 uA, uB; uniform float uGrow, uW, uK, uTip;
            varying vec3 vS;                                  // s along tunnel, y across (|y|=1 at wall), grown length
            varying vec2 vF;                                  // flare at start, flare at end
            void main() {
              float u = position.x + 0.5;
              vec3 B = mix(uA, uB, uGrow);
              vec4 a = viewMatrix * vec4(uA, 1.0), b = viewMatrix * vec4(B, 1.0);
              vec2 d = b.xy - a.xy; float dl = length(d); vec2 dir = dl > 1e-5 ? d / dl : vec2(1.0, 0.0);
              float L = length(B - uA), s = u * L;
              vF = vec2(exp(-s / (uW * 5.0)), exp(-(L - s) / (uW * 5.0)));
              float taper = mix(1.0, smoothstep(0.0, uW * 18.0, L - s), uTip);   // growing front narrows to a point
              vec4 p = mix(a, b, u); p.xy += vec2(-dir.y, dir.x) * position.y * HALO * uW * uK * (1.0 + 1.1 * (vF.x + vF.y * (1.0 - uTip))) * taper;
              vS = vec3(s, position.y * HALO, L);
              gl_Position = projectionMatrix * p;
            }`,
          fragmentShader: /* glsl */ `
            uniform float uT, uOp, uTip, uArr, uW, uPix; uniform vec3 uHi, uMid, uInk;
            varying vec3 vS; varying vec2 vF;
            float b2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
            float b4(vec2 a) { return b2(0.5 * a) * 0.25 + b2(a); }
            float b8(vec2 a) { return b4(0.5 * a) * 0.25 + b2(a); }
            void main() {
              float s = vS.x / (uW * 10.0), L = vS.z / (uW * 10.0), y = vS.y, v = abs(y);
              float tube = step(v, 1.0);
              float wall = smoothstep(0.78, 0.9, v) * tube;                  // crisp walls
              float core = step(v, 0.12);                                    // hairline beam
              float glow = exp(-max(v - 1.0, 0.0) * 3.0) * 0.55;             // dithered halo
              // comet lighting the tube, alternating direction each pass
              float ct = uT * 1.3, P = L + 10.0, back = mod(floor(ct / P), 2.0);
              float pos = mod(ct, P) - 2.0, ds = mix(s, L - s, back) - pos;
              float head = exp(-(ds * ds) / 0.05 - v * v * 6.0) * 1.6;
              float trail = step(ds, 0.0) * exp(ds / 1.4) * core * 0.9;
              float lit = exp(-abs(ds) / 1.8) * (wall * 0.9 + tube * 0.25 + glow * 0.8);
              float flow = (head + trail + lit) * (1.0 - uTip);
              float tip = uTip * exp(-pow((L - s) / 0.9, 2.0) - v * v * 5.0) * 0.35;   // faint spark on the beam while growing
              float mouth = vF.x + vF.y * (1.0 - uTip) * (1.0 + uArr * 2.0);  // glowing ports; far one opens on arrival
              float ends = smoothstep(0.0, 0.3, s) * smoothstep(0.0, 0.3, L - s + uTip);
              float l = ((wall * 0.38 + core * 0.22 + glow * 0.12) + flow + tip + mouth * exp(-v * 1.2) * 0.6) * uOp * ends;
              float th = b8(floor(gl_FragCoord.xy / uPix));
              float q = clamp(l, 0.0, 1.0) * 3.0, lv = floor(q) + step(th, fract(q));
              if (lv < 0.5) discard;
              gl_FragColor = vec4(lv < 1.5 ? uInk : lv < 2.5 ? uMid : uHi, 1.0);
            }`,
        }),
      );
      tube.frustumCulled = false;
      tube.visible = false;
      this.scene.add(tube);
      return [
        {
          ia,
          ib,
          tube,
          U,
          grow: 0,
          gTgt: 0,
          op: 0,
          arrive: 0,
          from: -1,
          off: r(),
          s: new THREE.Vector3(),
          e: new THREE.Vector3(),
        },
      ];
    });
  }

  // Ground plane at y=0 drawn last without depth test. Revealed space is a smooth union of discs
  // around known planets (an SDF); everything outside is fog, rendered with an 8x8 Bayer dither.
  private fog() {
    this.fogU = {
      uN: { value: this.N.map(() => new THREE.Vector3()) }, // x, z, reveal radius
      uT: { value: 0 },
      uPix: { value: 1 },
      uBg: { value: new THREE.Color(CFG.bg) },
      uMid: { value: new THREE.Color(CFG.fogMid) },
      uInk: { value: new THREE.Color(CFG.fogInk) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.fogU,
      defines: { NN: this.N.length },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec2 vW;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uN[NN];
        uniform float uT, uPix; uniform vec3 uBg, uMid, uInk;
        varying vec2 vW;
        float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p) {
          vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.0), f.x), f.y);
        }
        float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 17.0; a *= 0.5; } return s; }
        float b2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
        float b4(vec2 a) { return b2(0.5 * a) * 0.25 + b2(a); }
        float b8(vec2 a) { return b4(0.5 * a) * 0.25 + b2(a); }
        float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
        void main() {
          vec2 drift = vec2(uT * 0.6, uT * 0.25);
          float d = 1e4;                                                  // < 0 inside revealed space
          for (int i = 0; i < NN; i++) { if (uN[i].z > 0.01) d = smin(d, length(vW - uN[i].xy) - uN[i].z, 2.5); }
          d += (fbm((vW + drift * 0.3) * 0.18) - 0.5) * 3.0;               // billowy edge
          float th = b8(floor(gl_FragCoord.xy / uPix));
          if (smoothstep(-1.0, 1.0, d) <= th) discard;                    // dithered border
          float rim = exp(-pow((d - 0.8) / 1.2, 2.0));                     // glow hugging the outside
          float cloud = clamp(fbm((vW + drift) * 0.09) - 0.35, 0.0, 1.0) * exp(-max(d, 0.0) * 0.05);
          float l = clamp(cloud + rim * 0.85, 0.0, 1.0) * 2.0, lv = floor(l) + step(fract(th + 0.5), fract(l));
          gl_FragColor = vec4(lv < 0.5 ? uBg : lv < 1.5 ? uMid : uInk, 1.0);
        }`,
    });
    this.fogMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    this.fogMesh.quaternion.copy(this.flatQ);
    this.fogMesh.frustumCulled = false;
    this.fogMesh.renderOrder = 10;
    this.scene.add(this.fogMesh);
  }

  private fogTick(w: number, h: number) {
    const U = this.fogU;
    const c = this.cam;
    U.uT.value = this.t;
    U.uPix.value = CFG.ditherPx * this.renderer.getPixelRatio();
    this.fogMesh.position.set(c.target.x, 0, c.target.z);
    this.fogMesh.scale.setScalar(c.dist * (w / h + 2) * 2);
    this.N.forEach((p, i) =>
      U.uN.value[i].set(
        this.P[i].x,
        this.P[i].z,
        p.vis.f > 0.01 ? this.Rad[i] + this.revealR * p.vis.f : 0,
      ),
    );
  }

  private orient(e: LinkView, from: number) {
    e.from = from;
    const to = from === e.ia ? e.ib : e.ia;
    const A = this.P[from];
    const B = this.P[to];
    const dir = new THREE.Vector3().subVectors(B, A).normalize();
    e.s.copy(A).addScaledVector(dir, this.Rad[from] * 1.6 * CFG.ringK);
    e.e.copy(B).addScaledVector(dir, -this.Rad[to] * 1.6 * CFG.ringK);
  }

  private local(e: PointerEvent) {
    const r = this.el.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  }

  private screen(i: number, out: Screen) {
    if (!this.project(this.P[i], out)) return false;
    out.r = (this.Rad[i] * this.h) / (this.camera.top - this.camera.bottom);
    return true;
  }

  private project(p: THREE.Vector3, out: Screen) {
    const V = this.projected.copy(p).project(this.camera);
    if (V.z > 1) return false;
    out.x = (V.x * 0.5 + 0.5) * this.w;
    out.y = (-V.y * 0.5 + 0.5) * this.h;
    return true;
  }

  private pickAt(x: number, y: number) {
    let best = -1;
    let bs = 1e9;
    const o: Screen = { x: 0, y: 0, r: 0 };
    this.N.forEach((_, i) => {
      if (!this.screen(i, o)) return;
      const dd = Math.hypot(o.x - x, o.y - y);
      const lim = Math.max(14, o.r * 1.4 * CFG.ringK);
      if (dd < lim && dd / lim < bs) {
        bs = dd / lim;
        best = i;
      }
    });
    return best;
  }

  private listen() {
    const { cv } = this;
    const g = this.goal;
    const opts = { signal: this.events.signal };
    cv.addEventListener("contextmenu", (e) => e.preventDefault(), opts);
    cv.addEventListener(
      "pointerdown",
      (e) => {
        const [x, y] = this.local(e);
        this.drag = { x, y, sx: x, sy: y, moved: false };
        cv.setPointerCapture(e.pointerId);
      },
      opts,
    );
    cv.addEventListener(
      "pointermove",
      (e) => {
        const [x, y] = this.local(e);
        const d = this.drag;
        if (d) {
          if (!d.moved && Math.hypot(x - d.sx, y - d.sy) > 4) {
            d.moved = true;
            cv.style.cursor = "grabbing";
          }
          if (d.moved) {
            const u = g.dist / this.h;
            const f = new THREE.Vector3();
            this.camera.getWorldDirection(f);
            f.y = 0;
            f.normalize();
            const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
            g.target
              .addScaledVector(right, -(x - d.x) * u)
              .addScaledVector(f, ((y - d.y) * u) / Math.cos(CFG.phi));
          }
          d.x = x;
          d.y = y;
          return;
        }
        this.hover = this.pickAt(x, y);
        cv.style.cursor =
          this.hover >= 0 && this.st?.[this.ids[this.hover]] !== "uncharted" ? "pointer" : "grab";
      },
      opts,
    );
    cv.addEventListener(
      "pointerup",
      () => {
        const d = this.drag;
        this.drag = null;
        cv.style.cursor = "grab";
        if (d && !d.moved) {
          const i = this.pickAt(d.sx, d.sy);
          this.o.onPick(i >= 0 ? this.ids[i] : null);
        }
      },
      opts,
    );
    cv.addEventListener(
      "pointerleave",
      () => {
        this.hover = -1;
      },
      opts,
    );
    cv.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        g.dist = Math.max(CFG.dMin, Math.min(CFG.dMax, g.dist * Math.exp(e.deltaY * 0.0012)));
      },
      { ...opts, passive: false },
    );
  }

  private readonly tick = (ts: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const still = this.reducedMotion.matches;
    const dt = Math.min(0.05, (ts - (this.lt || ts)) / 1000);
    this.lt = ts;
    // With reduced motion, ambient time stops and every transition lands on its target at once.
    if (!still) this.t += dt;
    const step = still ? Infinity : dt;
    const w = this.el.clientWidth;
    const h = this.el.clientHeight;
    if (!w || !h || !this.st) return;
    if (w !== this.w || h !== this.h) {
      this.w = w;
      this.h = h;
      this.renderer.setSize(w, h, false);
    }
    this.moveCamera(step);
    this.animatePlanets(step);
    this.animateTubes(step);
    this.placeLabels();
    this.fogTick(w, h);
    this.renderer.render(this.scene, this.camera);
  };

  private moveCamera(dt: number) {
    const { w, h } = this;
    const cam = this.camera;
    const c = this.cam;
    const g = this.goal;
    const k = 1 - Math.exp(-dt * 3.2);
    c.target.lerp(g.target, k);
    c.dist += (g.dist - c.dist) * k;
    this.off.x += (this.offGoal.x - this.off.x) * k;
    this.off.y += (this.offGoal.y - this.off.y) * k;
    const hh = c.dist / 2;
    cam.top = hh;
    cam.bottom = -hh;
    cam.left = (-hh * w) / h;
    cam.right = (hh * w) / h;
    cam.setViewOffset(w, h, this.off.x, this.off.y, w, h);
    const sp = Math.sin(CFG.phi);
    cam.position.set(
      c.target.x + 200 * sp * Math.cos(CFG.theta),
      c.target.y + 200 * Math.cos(CFG.phi),
      c.target.z + 200 * sp * Math.sin(CFG.theta),
    );
    cam.lookAt(c.target);
    cam.updateMatrixWorld();
  }

  private animatePlanets(dt: number) {
    const kk = 1 - Math.exp(-dt * 4);
    this.N.forEach((p, i) => {
      const vv = p.vis;
      const tg = p.tgt;
      for (const key of Object.keys(tg) as (keyof Look)[]) vv[key] += (tg[key] - vv[key]) * kk;
      p.mesh.material.color.setScalar(vv.c);
      p.mesh.rotation.y = this.t * p.spin;
      const on = i === this.sel || i === this.hover;
      const pulse = on ? 1.1 + 0.025 * Math.sin(this.t * 3) : 1;
      if (p.ringMat) p.ringMat.opacity = vv.r * (on ? 1.6 : 1);
      p.ring.scale.setScalar(this.Rad[i] * (p.hole ? 1 : CFG.ringK) * pulse);
      if (p.hole) {
        p.hole.uT.value = this.t;
        p.hole.uOpacity.value = vv.l;
      }
      p.dash.material.opacity = vv.d * (on ? 1 : 0.6);
      p.dash.quaternion.copy(this.flatQ);
      p.dash.rotateZ(this.t * 0.3);
      p.dash.scale.setScalar(this.Rad[i] * 1.55 * CFG.ringK * pulse);
    });
  }

  private animateTubes(dt: number) {
    const kk = 1 - Math.exp(-dt * 4);
    const tw = Math.max(0.1, this.cam.dist * 0.0032);
    const dpx = CFG.tubePx * this.renderer.getPixelRatio();
    for (const e of this.E) {
      const was = e.grow;
      e.grow = e.gTgt ? Math.min(1, e.grow + dt * 0.9) : 0;
      if (was < 1 && e.grow >= 1) e.arrive = 1;
      e.arrive = Math.max(0, e.arrive - dt * 1.5);
      const on = e.gTgt > 0 && e.grow > 0.001;
      const touch = [this.sel, this.hover].some((i) => i >= 0 && (i === e.ia || i === e.ib));
      e.op += ((on ? 0.8 * (touch ? 1.35 : 1) : 0) - e.op) * kk;
      e.tube.visible = on;
      if (!on) continue;
      const { U } = e;
      U.uA.value.copy(e.s);
      U.uB.value.copy(e.e);
      U.uGrow.value = 1 - (1 - e.grow) ** 3;
      U.uW.value = tw;
      U.uT.value = this.t + e.off * 10;
      U.uOp.value = e.op;
      U.uTip.value = e.grow < 1 ? Math.min(1, (1 - e.grow) * 6) : 0;
      U.uArr.value = e.arrive;
      U.uPix.value = dpx;
      U.uK.value = CFG.tubeK;
    }
  }

  private placeLabels() {
    const o: Screen = { x: 0, y: 0, r: 0 };
    this.N.forEach((p, i) => {
      if (!p.label) return;
      const op = p.vis.l;
      if (op < 0.02 || !this.screen(i, o)) {
        if (p.labelShown) {
          p.label.style.opacity = "0";
          p.labelShown = false;
        }
        return;
      }
      p.labelShown = true;
      // Avoid DOM mutations on every frame when reduced motion holds the map still.
      const opacity = String(Number(op.toFixed(3)));
      if (p.label.style.opacity !== opacity) p.label.style.opacity = opacity;
      const y = o.y + o.r * (p.hole ? 1.4 : 1.15) + 8;
      const transform = `translate(${Number(o.x.toFixed(1))}px, ${Number(y.toFixed(1))}px) translate(-50%, 0px)`;
      if (p.label.style.transform !== transform) p.label.style.transform = transform;
    });
    this.sectorPoints.forEach((point, i) => {
      const label = this.sectorLabels[i];
      if (label && this.project(point, o)) {
        const transform = `translate(${Number(o.x.toFixed(1))}px, ${Number(o.y.toFixed(1))}px) translate(-50%, -50%)`;
        if (label.style.transform !== transform) label.style.transform = transform;
      }
    });
  }
}
