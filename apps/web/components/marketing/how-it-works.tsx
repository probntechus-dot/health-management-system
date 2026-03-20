"use client";

import { Building2, Users, CalendarCheck, TrendingUp, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Step {
  step: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    step: "01",
    icon: Building2,
    title: "Register Your Clinic",
    description:
      "Sign up and set up your clinic profile in minutes. Add your clinic details, working hours, and services offered.",
  },
  {
    step: "02",
    icon: Users,
    title: "Add Your Team",
    description:
      "Invite doctors and receptionists to your workspace. Assign roles and manage access levels with ease.",
  },
  {
    step: "03",
    icon: CalendarCheck,
    title: "Manage Appointments",
    description:
      "Start booking appointments, managing patient records, and issuing digital prescriptions immediately.",
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Grow Your Practice",
    description:
      "Track revenue, monitor patient trends, and use insights to improve your clinic's performance over time.",
  },
];

function StepIllustration({ step, Icon }: { step: string; Icon: LucideIcon }) {
  // Each step gets a unique mini illustration
  if (step === "01") {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#e8f0fc] to-[#d0e3f9] rounded-2xl p-6 flex flex-col justify-center items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center">
          <Icon className="w-8 h-8 text-[#0a5ab3]" />
        </div>
        <div className="w-full space-y-2">
          <div className="h-2 bg-white/60 rounded-full w-3/4 mx-auto" />
          <div className="h-2 bg-white/40 rounded-full w-1/2 mx-auto" />
          <div className="flex gap-2 justify-center mt-3">
            <div className="w-16 h-8 rounded-lg bg-[#0a5ab3]/10 border border-[#0a5ab3]/20" />
            <div className="w-16 h-8 rounded-lg bg-[#69B531]/10 border border-[#69B531]/20" />
          </div>
        </div>
      </div>
    );
  }
  if (step === "02") {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#e8f0fc] to-[#d0e3f9] rounded-2xl p-6 flex flex-col justify-center items-center gap-3">
        <div className="flex -space-x-3">
          {["#0a5ab3", "#69B531", "#f59e0b", "#e53935"].map((c, i) => (
            <div key={i} className="w-11 h-11 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-[11px] font-bold" style={{ backgroundColor: c, zIndex: 4 - i }}>
              {["DA", "SK", "FM", "UR"][i]}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <span className="text-[10px] bg-[#0a5ab3]/10 text-[#0a5ab3] px-2.5 py-1 rounded-full font-semibold">Doctor</span>
          <span className="text-[10px] bg-[#69B531]/10 text-[#69B531] px-2.5 py-1 rounded-full font-semibold">Receptionist</span>
          <span className="text-[10px] bg-[#f59e0b]/10 text-[#f59e0b] px-2.5 py-1 rounded-full font-semibold">Admin</span>
        </div>
      </div>
    );
  }
  if (step === "03") {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#e8f0fc] to-[#d0e3f9] rounded-2xl p-5 flex flex-col justify-center gap-2">
        {[
          { t: "09:00", n: "Sara K.", s: "Confirmed", c: "#69B531" },
          { t: "09:30", n: "Ahmed A.", s: "Waiting", c: "#f59e0b" },
          { t: "10:00", n: "Fatima M.", s: "Confirmed", c: "#69B531" },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-2 bg-white/70 rounded-lg p-2">
            <span className="text-[9px] text-gray-400 font-mono w-10">{a.t}</span>
            <span className="text-[10px] font-semibold text-[#1a2535] flex-1">{a.n}</span>
            <span className="text-[8px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: a.c + "15", color: a.c }}>{a.s}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#e8f0fc] to-[#d0e3f9] rounded-2xl p-5 flex flex-col justify-center items-center gap-3">
      {/* Mini bar chart */}
      <div className="flex items-end gap-2 h-16">
        {[30, 55, 45, 70, 65, 85, 75].map((h, i) => (
          <div key={i} className="w-4 rounded-sm" style={{ height: `${h}%`, background: i === 5 ? '#0a5ab3' : '#c5d9f5' }} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-[#69B531]">↑ 24%</span>
        <span className="text-[10px] text-gray-400">this month</span>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-white py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-16 lg:mb-24">
          <p className="text-[#69B531] text-[13px] font-semibold uppercase tracking-[0.15em] mb-4">
            How It Works
          </p>
          <h2 className="font-display text-[2.25rem] lg:text-[3rem] font-extrabold text-[#1a2535] mb-5 tracking-tight">
            Up & Running in{" "}
            <span className="gradient-text">4 Simple Steps</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            No lengthy onboarding, no complex setup. Your clinic is ready to go
            in under an hour.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative">
          {/* Center line (desktop) */}
          <div aria-hidden className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#0a5ab3]/20 via-[#0a5ab3]/10 to-transparent -translate-x-1/2" />

          {/* Mobile left line */}
          <div aria-hidden className="lg:hidden absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#0a5ab3]/20 via-[#0a5ab3]/10 to-transparent" />

          <div className="space-y-12 lg:space-y-24">
            {STEPS.map((step, i) => (
              <TimelineStep key={step.step} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineStep({ step, index }: { step: Step; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isLeft = index % 2 === 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const Icon = step.icon;

  return (
    <div
      ref={ref}
      className={`relative transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {/* Desktop layout — alternating */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-16 items-center">
        {/* Left side */}
        <div className={`${isLeft ? "" : "order-2"}`}>
          <div className={`${isLeft ? "text-right pr-12" : "pl-12"}`}>
            <span className="inline-block text-[#0a5ab3]/20 font-display text-[5rem] font-extrabold leading-none mb-2">
              {step.step}
            </span>
            <h3 className="font-display text-2xl font-bold text-[#1a2535] mb-3">
              {step.title}
            </h3>
            <p className="text-[15px] text-gray-500 leading-relaxed max-w-md ${isLeft ? 'ml-auto' : ''}">
              {step.description}
            </p>
          </div>
        </div>

        {/* Right side — illustration */}
        <div className={`${isLeft ? "" : "order-1"}`}>
          <div className={`${isLeft ? "pl-12" : "pr-12 flex justify-end"}`}>
            <div className="w-56 h-40">
              <StepIllustration step={step.step} Icon={Icon} />
            </div>
          </div>
        </div>
      </div>

      {/* Center dot (desktop) */}
      <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-12 h-12 rounded-full bg-white border-2 border-[#0a5ab3]/20 flex items-center justify-center shadow-lg">
          <Icon className="w-5 h-5 text-[#0a5ab3]" />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden flex gap-5 pl-2">
        {/* Timeline dot */}
        <div className="flex-shrink-0 relative z-10">
          <div className="w-10 h-10 rounded-full bg-white border-2 border-[#0a5ab3]/20 flex items-center justify-center shadow-md">
            <Icon className="w-4 h-4 text-[#0a5ab3]" />
          </div>
        </div>

        {/* Content */}
        <div className="pb-2 flex-1">
          <span className="text-[#0a5ab3]/20 font-display text-[2.5rem] font-extrabold leading-none">
            {step.step}
          </span>
          <h3 className="font-display text-lg font-bold text-[#1a2535] mb-2 -mt-2">
            {step.title}
          </h3>
          <p className="text-[14px] text-gray-500 leading-relaxed mb-4">
            {step.description}
          </p>
          <div className="w-full h-32">
            <StepIllustration step={step.step} Icon={Icon} />
          </div>
        </div>
      </div>
    </div>
  );
}
