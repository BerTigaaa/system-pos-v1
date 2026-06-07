"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: 100 | 200 | 300 | 400;
};

export default function Reveal({ children, className, delay }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -80px 0px",
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "reveal-base",
        isVisible && "is-visible",
        delay === 100 && "reveal-delay-100",
        delay === 200 && "reveal-delay-200",
        delay === 300 && "reveal-delay-300",
        delay === 400 && "reveal-delay-400",
        className,
      )}
    >
      {children}
    </div>
  );
}
