import type { IsoMap } from "./IsoMap";

/** Camera distance of the fogged field, wide enough that no planet stands out. */
export const FIELD_DISTANCE = 108;

const DURATION = 3600;
const BIRTH = 1500;
// Past the outermost tier, so the front has revealed every planet when it stops.
const FRONT = 40;
// The isometric camera foreshortens the ground plane by cos(phi), so rings on it are ellipses.
const GROUND = 0.5774;

export interface ArrivalOverlays {
  flash: HTMLElement | null;
  pulse: HTMLElement | null;
  ring: HTMLElement | null;
  echo: HTMLElement | null;
}

const easeOut = (t: number, power: number) => 1 - (1 - t) ** power;

/**
 * Plays the learner's arrival on a fully fogged map: a slow inhale towards the centre, then
 * The Craft collapses into being with a flash and a shockwave, and its fog clearing sweeps
 * outwards to reveal the map as it stands. Returns a function that stops the sequence.
 */
export function arrive(map: IsoMap, overlays: ArrivalOverlays, onDone: () => void) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    settle(map, overlays);
    onDone();
    return () => {};
  }

  const { flash, pulse, ring, echo } = overlays;
  const start = performance.now();
  let dist = FIELD_DISTANCE;
  let raf = 0;
  map.setRevealFront(-1);
  map.setPlanetScale(0.001);
  map.setRevealScale(0);
  map.setZoom(FIELD_DISTANCE, { instant: true });

  const frame = (now: number) => {
    const t = now - start;
    if (t < BIRTH) {
      // Inhale: the fog pulls towards the point of collapse.
      const goal = FIELD_DISTANCE - 40 * easeOut(t / BIRTH, 2);
      dist += (goal - dist) * 0.12;
      map.setZoom(dist, { instant: true });
    } else {
      const u = Math.min(1, (t - BIRTH) / (DURATION - BIRTH));
      map.setRevealFront(FRONT * easeOut(u, 2));

      // Punch in on the singularity, then pull back out over the revealed map.
      const punch = 18 * Math.sin(Math.min(1, u * 2.2) * Math.PI) * Math.exp(-u * 2);
      dist += (68 - 16 * easeOut(u, 3) - punch - dist) * 0.22;
      map.setZoom(dist, { instant: true });

      // Elastic pop, settling on the planets' own size.
      const pop =
        u < 0.45
          ? easeOut(u / 0.45, 3) * 1.5
          : 1 + 0.5 * Math.exp(-(u - 0.45) * 12) * Math.cos((u - 0.45) * 34);
      map.setPlanetScale(Math.max(0.001, pop));
      map.setRevealScale(easeOut(Math.min(1, u * 1.6), 2));

      const shake = 0.9 * Math.exp(-u * 9);
      map.shake((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

      if (flash) flash.style.opacity = String(Math.max(0, 0.85 * Math.exp(-u * 7)));
      shockwave(ring, u, 0, 0.9);
      shockwave(echo, u, 0.14, 0.5);

      // A bright disc of space swelling out behind the rings: it blooms hard, then breathes down.
      if (pulse) {
        const v = easeOut(Math.min(1, u * 1.25), 2);
        pulse.style.transform = ground(0.02 + v * 1.35);
        pulse.style.opacity = String(Math.max(0, (1 - v) * (0.55 + 0.45 * Math.cos(u * 15)) * 0.9));
      }
    }

    if (t >= DURATION) {
      settle(map, overlays);
      onDone();
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

function settle(map: IsoMap, { flash, pulse, ring, echo }: ArrivalOverlays) {
  for (const node of [flash, pulse, ring, echo]) if (node) node.style.opacity = "0";
  map.setRevealFront(Infinity);
  map.setPlanetScale(1);
  map.setRevealScale(1);
  map.overview();
}

function shockwave(node: HTMLElement | null, u: number, delay: number, peak: number) {
  const v = (u - delay) / (1 - delay);
  if (!node || v <= 0) return;
  node.style.opacity = String(Math.max(0, peak * (1 - v)));
  node.style.transform = ground(0.04 + easeOut(v, 2) * 1.5);
}

function ground(scale: number) {
  return `scale(${scale}, ${scale * GROUND})`;
}
