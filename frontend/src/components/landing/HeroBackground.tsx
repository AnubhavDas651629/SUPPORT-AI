"use client";

import { useEffect, useRef } from "react";

/** CSS px per marching-squares cell. Larger = cheaper, still smooth at this opacity. */
const CELL = 22;
/** Number of contour bands drawn across the field's range. */
const LEVELS = 15;
/** Every Nth contour is drawn heavier, the way index contours work on a real topo map. */
const INDEX_EVERY = 5;
const FIELD_RANGE = 1.75;
const FRAME_MS = 1000 / 30;

/**
 * A slow topographic contour field.
 *
 * Contours are generated with marching squares over a smooth sum-of-sines
 * height field, so these are real iso-lines rather than decorative squiggles.
 * Deliberately no WebGL: this layer has to sit at ~6% opacity and disappear
 * behind the headline, which does not justify a GL context.
 */
export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let cw = 0;
    let ch = 0;
    let field = new Float32Array(0);
    let raf = 0;
    let last = 0;
    let visible = true;
    let running = false;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.max(2, Math.ceil(width / CELL));
      rows = Math.max(2, Math.ceil(height / CELL));
      cw = width / cols;
      ch = height / rows;
      field = new Float32Array((cols + 1) * (rows + 1));
    };

    const computeField = (t: number) => {
      const stride = cols + 1;
      for (let j = 0; j <= rows; j++) {
        const v = (j * ch) / height;
        for (let i = 0; i <= cols; i++) {
          const u = (i * cw) / width;
          const a = Math.sin(u * 3.1 + t * 0.1) * Math.cos(v * 2.4 - t * 0.08);
          const b = Math.sin(u * 1.9 + v * 2.7 + t * 0.06);
          const c = Math.cos(u * 2.6 - v * 1.7 - t * 0.05);
          field[j * stride + i] = a + b * 0.55 + c * 0.42;
        }
      }
    };

    const drawLevel = (level: number) => {
      const stride = cols + 1;
      for (let j = 0; j < rows; j++) {
        const y0 = j * ch;
        const y1 = y0 + ch;
        for (let i = 0; i < cols; i++) {
          const tl = field[j * stride + i];
          const tr = field[j * stride + i + 1];
          const br = field[(j + 1) * stride + i + 1];
          const bl = field[(j + 1) * stride + i];

          let idx = 0;
          if (tl > level) idx |= 8;
          if (tr > level) idx |= 4;
          if (br > level) idx |= 2;
          if (bl > level) idx |= 1;
          if (idx === 0 || idx === 15) continue;

          const x0 = i * cw;
          const x1 = x0 + cw;
          // Edge crossings by linear interpolation. Only edges with a sign change
          // are read, so the unused ones never divide by zero in practice.
          const tX = x0 + ((level - tl) / (tr - tl)) * cw;
          const rY = y0 + ((level - tr) / (br - tr)) * ch;
          const bX = x0 + ((level - bl) / (br - bl)) * cw;
          const lY = y0 + ((level - tl) / (bl - tl)) * ch;

          switch (idx) {
            case 1:
            case 14:
              ctx.moveTo(x0, lY);
              ctx.lineTo(bX, y1);
              break;
            case 2:
            case 13:
              ctx.moveTo(bX, y1);
              ctx.lineTo(x1, rY);
              break;
            case 3:
            case 12:
              ctx.moveTo(x0, lY);
              ctx.lineTo(x1, rY);
              break;
            case 4:
            case 11:
              ctx.moveTo(tX, y0);
              ctx.lineTo(x1, rY);
              break;
            case 6:
            case 9:
              ctx.moveTo(tX, y0);
              ctx.lineTo(bX, y1);
              break;
            case 7:
            case 8:
              ctx.moveTo(x0, lY);
              ctx.lineTo(tX, y0);
              break;
            case 5:
              ctx.moveTo(x0, lY);
              ctx.lineTo(tX, y0);
              ctx.moveTo(bX, y1);
              ctx.lineTo(x1, rY);
              break;
            case 10:
              ctx.moveTo(tX, y0);
              ctx.lineTo(x1, rY);
              ctx.moveTo(x0, lY);
              ctx.lineTo(bX, y1);
              break;
          }
        }
      }
    };

    const render = (t: number) => {
      computeField(t);
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";

      for (let n = 0; n < LEVELS; n++) {
        const level = -FIELD_RANGE + (n / (LEVELS - 1)) * FIELD_RANGE * 2;
        const isIndex = n % INDEX_EVERY === 0;
        ctx.beginPath();
        ctx.strokeStyle = isIndex ? "rgba(170,186,226,0.22)" : "rgba(150,166,198,0.105)";
        ctx.lineWidth = isIndex ? 1.05 : 0.85;
        drawLevel(level);
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      if (!visible) {
        running = false;
        return;
      }
      if (now - last >= FRAME_MS) {
        last = now;
        render(now / 1000);
      }
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduced.matches) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      running = false;
    };

    const onResize = () => {
      resize();
      if (reduced.matches) render(0);
    };

    const onMotionChange = () => {
      if (reduced.matches) {
        stop();
        render(0);
      } else {
        start();
      }
    };

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) start();
      else stop();
    };

    resize();
    render(0);

    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);

    // Don't burn frames on a hero that has been scrolled past.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && !document.hidden;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onMotionChange);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Atmospheric ground: two very low-alpha brand washes, no animation. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(192,38,211,0.10) 0%, transparent 55%)," +
            "radial-gradient(90% 70% at 12% 108%, rgba(79,70,229,0.10) 0%, transparent 60%)",
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Sinks the contours directly behind the type so the headline stays the focus. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(56% 40% at 50% 34%, rgba(2,6,23,0.93) 0%, rgba(2,6,23,0.55) 48%, transparent 76%)",
        }}
      />

      {/* Edge falloff + hand-off to the section below. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #020617 0%, transparent 12%, transparent 78%, #020617 100%)," +
            "linear-gradient(to right, #020617 0%, transparent 9%, transparent 91%, #020617 100%)",
        }}
      />
    </div>
  );
}
