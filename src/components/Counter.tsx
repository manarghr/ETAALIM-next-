"use client";

import { useEffect, useRef, useState, CSSProperties } from "react";

interface CounterProps {
  target: number;
  suffix?: string;
  className?: string;
  duration?: number;
  style?: CSSProperties;
  /** where the count-up starts, as a fraction of the target (0-1) */
  startRatio?: number;
}

// Counts up to `target` once scrolled into view — starting near the target
// (not 0) and easing out, so it feels calm rather than a fast number blur.
export default function Counter({
  target,
  suffix = "",
  className,
  duration = 2600,
  style,
  startRatio = 0.9,
}: CounterProps) {
  const start = Math.floor(target * startRatio);
  const [value, setValue] = useState(start);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const t0 = Date.now();
            const tick = () => {
              const p = Math.min((Date.now() - t0) / duration, 1);
              const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
              setValue(Math.round(start + (target - start) * eased));
              if (p < 1) requestAnimationFrame(tick);
            };
            tick();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, start]);

  return (
    <span ref={ref} className={className} style={style}>
      {value}
      {suffix}
    </span>
  );
}
