"use client";

import { useEffect, useRef } from "react";

export default function ParallaxHero({
  backdropUrl,
  children,
}: {
  backdropUrl: string;
  children: React.ReactNode;
}) {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (bgRef.current) {
          bgRef.current.style.transform = `translate3d(0, ${y * 0.35}px, 0) scale(1.12)`;
        }
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="hero">
      <div className="hero-bg" ref={bgRef} style={{ backgroundImage: `url(${backdropUrl})` }} />
      <div className="hero-fade" />
      <div className="wrap hero-content">{children}</div>
    </div>
  );
}
