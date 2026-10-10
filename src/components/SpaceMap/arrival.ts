import type { IsoMap } from "./IsoMap";

/** Camera distance of the fogged field, wide enough that no planet stands out. */
export const FIELD_DISTANCE = 108;

const DURATION = 2400;
const BIRTH = 600;
const APPROACH_DISTANCE = 32;
const CRAFT_DISTANCE = 18;
const CLOSE_UP = 0.22;
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

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number, power: number) => 1 - (1 - t) ** power;

/**
 * Zooms in on The Craft as it appears, holds that view while a single wave reveals the map.
 * Camera and overlay positions depend on elapsed time so the sequence keeps the same pace
 * across display refresh rates. Returns a function that stops the sequence.
 */
export function arrive(map: IsoMap, overlays: ArrivalOverlays, onDone: () => void) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    settleArrival(map, overlays);
    onDone();
    return () => {};
  }

  const { flash, pulse, ring, echo } = overlays;
  const start = performance.now();
  let raf = 0;
  map.setRevealFront(-1);
  map.setPlanetScale(0.001);
  map.setRevealScale(0);
  map.setZoom(FIELD_DISTANCE, { instant: true });

  const frame = (now: number) => {
    const t = now - start;
    if (t < BIRTH) {
      const anticipation = smoothstep(Math.min(1, t / BIRTH));
      map.setZoom(FIELD_DISTANCE + (APPROACH_DISTANCE - FIELD_DISTANCE) * anticipation, {
        instant: true,
      });
      // A small glow makes the point of arrival visible before the fog opens.
      if (pulse) {
        pulse.style.transform = ground(0.012 + anticipation * 0.04);
        pulse.style.opacity = String(anticipation * 0.55);
      }
    } else {
      const u = Math.min(1, (t - BIRTH) / (DURATION - BIRTH));
      const reveal = Math.max(0, (u - CLOSE_UP) / (1 - CLOSE_UP));
      const wave = easeOut(reveal, 2);
      map.setRevealFront(FRONT * wave);
      // Zoom onto The Craft and hold that distance through the reveal.
      const distance =
        u < CLOSE_UP
          ? APPROACH_DISTANCE + (CRAFT_DISTANCE - APPROACH_DISTANCE) * smoothstep(u / CLOSE_UP)
          : CRAFT_DISTANCE;
      map.setZoom(distance, { instant: true });

      // One small overshoot settles without a second bounce.
      const growth = Math.min(1, u / 0.55);
      map.setPlanetScale(
        Math.max(0.001, 1 + 2.70158 * (growth - 1) ** 3 + 1.70158 * (growth - 1) ** 2),
      );
      map.setRevealScale(easeOut(Math.min(1, u / 0.75), 2));

      if (flash) flash.style.opacity = String(0.28 * (1 - Math.min(1, u / 0.3)) ** 2);
      shockwave(ring, u, 0, 0.45);
      shockwave(echo, u, 0.12, 0.18);

      if (pulse) {
        pulse.style.transform = ground(0.052 + wave * 1.1);
        pulse.style.opacity = String(0.55 * (1 - u) ** 3);
      }
    }

    if (t >= DURATION) {
      settleArrival(map, overlays);
      onDone();
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

export function settleArrival(map: IsoMap, { flash, pulse, ring, echo }: ArrivalOverlays) {
  for (const node of [flash, pulse, ring, echo]) if (node) node.style.opacity = "0";
  map.setRevealFront(Infinity);
  map.setPlanetScale(1);
  map.setRevealScale(1);
  map.setZoom(CRAFT_DISTANCE, { instant: true });
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
