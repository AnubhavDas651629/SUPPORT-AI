"use client";

import { useEffect, useRef, useState } from "react";

/** Measures a container so SVG charts render at real pixel width (no stroke distortion). */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next && next > 0) setWidth(next);
    });
    observer.observe(el);
    setWidth(el.clientWidth || fallback);
    return () => observer.disconnect();
  }, [fallback]);

  return { ref, width };
}
