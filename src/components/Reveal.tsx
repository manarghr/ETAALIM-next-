"use client";

import { useEffect, useRef, useState, ElementType, CSSProperties } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** entrance delay in ms for staggered reveals */
  delay?: number;
  /** element/tag to render (default div) */
  as?: ElementType;
  /** extra inline styles (merged with the transition delay) */
  style?: CSSProperties;
}

// Fades + slides its children in once they scroll into view.
export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </Tag>
  );
}
