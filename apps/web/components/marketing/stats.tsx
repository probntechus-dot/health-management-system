"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 500, suffix: "+", label: "Registered Doctors" },
  { value: 50, suffix: "+", label: "Partner Clinics" },
  { value: 10000, suffix: "+", label: "Patients Served" },
  { value: 98, suffix: "%", label: "Satisfaction Rate" },
];

export default function Stats() {
  return (
    <section className="relative bg-[#0d1b2e] overflow-hidden">
      {/* Ambient light effects */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0a5ab3]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#69B531]/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>

      {/* Gradient border bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0a5ab3]/30 to-transparent" />
    </section>
  );
}

function StatCard({ stat, index }: { stat: typeof STATS[0]; index: number }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = stat.value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= stat.value) {
        setCount(stat.value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, stat.value]);

  return (
    <div
      ref={ref}
      className={`relative text-center transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <p className="font-display text-[3.5rem] lg:text-[4.5rem] font-extrabold tracking-tight leading-none mb-3 gradient-text">
        {count.toLocaleString()}{stat.suffix}
      </p>
      <p className="text-[14px] text-gray-400 font-medium tracking-wide uppercase">
        {stat.label}
      </p>
      {/* Subtle underline accent */}
      <div className="mx-auto mt-4 w-8 h-[2px] rounded-full bg-gradient-to-r from-[#0a5ab3] to-[#69B531] opacity-40" />
    </div>
  );
}
