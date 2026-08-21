"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";

interface WarpTextProps {
  text: string;
  className?: string;
  /** CSS gradient applied continuously across the phrase. */
  gradient?: string;
  /** Max vertical lift in px at the pointer's focus. */
  lift?: number;
  /** Max additional scale at the pointer's focus. */
  scaleAmount?: number;
  /** Max tilt in degrees at the edges of the falloff. */
  tilt?: number;
}

const DEFAULT_GRADIENT =
  "linear-gradient(100deg, #E3AEE4 0%, #BFA9EF 40%, #A2B1F0 72%, #96A9EA 100%)";

/**
 * Pointer-reactive warp on a single phrase.
 *
 * Distortion is transform-only (no layout shift), the gradient is measured so it
 * stays continuous across independently-transformed characters, and the whole
 * interaction is skipped for coarse pointers and prefers-reduced-motion.
 */
export function WarpText({
  text,
  className = "",
  gradient = DEFAULT_GRADIENT,
  lift = 6,
  scaleAmount = 0.05,
  tilt = 1.2,
}: WarpTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const metricsRef = useRef<{ el: HTMLElement; cx: number; cy: number }[]>([]);
  const valuesRef = useRef<Float32Array>(new Float32Array(0));
  const radiusRef = useRef(110);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const rafRef = useRef(0);
  const runningRef = useRef(false);

  /** Measure untransformed character positions and pin the gradient to them. */
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const chars = Array.from(root.querySelectorAll<HTMLElement>("[data-warp-char]"));
    // Reset transforms so we measure the resting layout, not a warped frame.
    for (const el of chars) el.style.transform = "";

    const rootRect = root.getBoundingClientRect();
    const metrics = chars.map((el) => {
      const r = el.getBoundingClientRect();
      const left = r.left - rootRect.left;
      // Pinning background-size to the phrase width and offsetting each character
      // by its own left edge keeps one continuous gradient across separate boxes.
      el.style.backgroundImage = gradient;
      el.style.backgroundSize = `${rootRect.width}px 100%`;
      el.style.backgroundPositionX = `${-left}px`;
      return {
        el,
        cx: left + r.width / 2,
        cy: r.top - rootRect.top + r.height / 2,
      };
    });

    metricsRef.current = metrics;
    if (valuesRef.current.length !== metrics.length) {
      valuesRef.current = new Float32Array(metrics.length);
    }
    // Scale the falloff with type size so the warp stays local at every breakpoint.
    radiusRef.current = Math.max(70, rootRect.height * 1.15);
  }, [gradient]);

  useLayoutEffect(() => {
    measure();
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    return () => ro.disconnect();
  }, [measure, text]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reduced.matches || !fine.matches) return;

    const root = rootRef.current;
    if (!root) return;

    const settle = () => {
      for (const m of metricsRef.current) m.el.style.transform = "";
      valuesRef.current.fill(0);
    };

    const frame = () => {
      const metrics = metricsRef.current;
      const values = valuesRef.current;
      if (!metrics.length) {
        runningRef.current = false;
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const px = pointerRef.current.x - rootRect.left;
      const py = pointerRef.current.y - rootRect.top;
      const radius = radiusRef.current;
      const active = pointerRef.current.active;

      let busy = false;

      for (let i = 0; i < metrics.length; i++) {
        const m = metrics[i];
        let target = 0;
        let dxn = 0;

        if (active) {
          dxn = (px - m.cx) / radius;
          const dyn = (py - m.cy) / (radius * 1.35);
          const d2 = dxn * dxn + dyn * dyn;
          if (d2 < 9) target = Math.exp(-d2);
        }

        const next = values[i] + (target - values[i]) * 0.16;
        values[i] = next;

        if (next > 0.002) {
          busy = true;
          const dir = dxn > 1 ? 1 : dxn < -1 ? -1 : dxn;
          m.el.style.transform =
            `translate3d(0,${(-lift * next).toFixed(2)}px,0) ` +
            `scale(${(1 + scaleAmount * next).toFixed(4)}) ` +
            `rotate(${(-tilt * dir * next).toFixed(3)}deg)`;
        } else if (values[i] !== 0) {
          values[i] = 0;
          m.el.style.transform = "";
        }
      }

      if (busy || active) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        runningRef.current = false;
      }
    };

    const start = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(frame);
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      // Only engage while the pointer is near the phrase; keeps the effect a
      // discovery rather than something that fires across the whole page.
      const r = root.getBoundingClientRect();
      const pad = radiusRef.current * 1.6;
      pointerRef.current.active =
        e.clientX > r.left - pad &&
        e.clientX < r.right + pad &&
        e.clientY > r.top - pad &&
        e.clientY < r.bottom + pad;
      if (pointerRef.current.active) start();
    };

    const onPointerLeave = () => {
      pointerRef.current.active = false;
      start();
    };

    const onMotionChange = () => {
      if (reduced.matches) {
        cancelAnimationFrame(rafRef.current);
        runningRef.current = false;
        pointerRef.current.active = false;
        settle();
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
    reduced.addEventListener("change", onMotionChange);

    return () => {
      cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      reduced.removeEventListener("change", onMotionChange);
      settle();
    };
  }, [lift, scaleAmount, tilt]);

  const words = text.split(" ");

  return (
    <span className={className}>
      {/* Real text for assistive tech; the split characters below are decorative.
          select-none keeps it out of copy/paste so the phrase isn't duplicated. */}
      <span className="sr-only select-none">{text}</span>
      {/* Padding reserves room for the lift so nothing clips, and because the
          warp is transform-only the reserved box never changes size. */}
      <span
        ref={rootRef}
        aria-hidden="true"
        className="inline-block py-[0.12em] align-baseline"
      >
        {words.map((word, wi) => (
          <React.Fragment key={`${word}-${wi}`}>
            <span className="inline-block whitespace-nowrap">
              {Array.from(word).map((ch, ci) => (
                <span
                  key={ci}
                  data-warp-char
                  className="inline-block bg-clip-text text-transparent [backface-visibility:hidden] [transform-origin:50%_80%] [will-change:transform]"
                  style={{ backgroundImage: gradient }}
                >
                  {ch}
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </span>
    </span>
  );
}
