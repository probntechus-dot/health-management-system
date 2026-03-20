"use client";

import {
  CalendarDays,
  ClipboardList,
  FileText,
  Users,
  BarChart2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  tag?: string;
  size: "large" | "medium" | "small";
  dark?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: FileText,
    title: "Digital Prescriptions",
    description:
      "Generate, print, and share professional prescriptions in seconds. Built-in drug database with dosage guidance.",
    tag: "Most loved",
    size: "large",
  },
  {
    icon: CalendarDays,
    title: "Smart Appointment Scheduling",
    description:
      "Book, reschedule, and track appointments with an intuitive calendar. Reduce no-shows and optimize your doctors\u0027 time.",
    size: "medium",
  },
  {
    icon: ClipboardList,
    title: "Comprehensive Patient Records",
    description:
      "Maintain a complete medical history for every patient \u2014 visit notes, diagnoses, allergies, and test results, all in one place.",
    size: "medium",
    dark: true,
  },
  {
    icon: Users,
    title: "Multi-Doctor & Staff Management",
    description:
      "Manage an entire team of doctors, specialists, and receptionists \u2014 each with their own dashboard and permissions.",
    size: "small",
  },
  {
    icon: BarChart2,
    title: "Revenue & Analytics",
    description:
      "Real-time insights into appointments, earnings, and clinic performance. Make data-driven decisions with ease.",
    size: "small",
    dark: true,
  },
  {
    icon: ShieldCheck,
    title: "Secure & Compliant",
    description:
      "Patient data is encrypted and stored securely. Role-based access ensures the right people see the right information.",
    size: "small",
  },
];

// Shared IntersectionObserver for all BentoCards
type VisibilityCallback = () => void
const _visibilityCallbacks = new Map<Element, VisibilityCallback>()
let _sharedObserver: IntersectionObserver | null = null

function getSharedObserver(): IntersectionObserver {
  if (!_sharedObserver) {
    _sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const cb = _visibilityCallbacks.get(entry.target)
            if (cb) {
              cb()
              _sharedObserver?.unobserve(entry.target)
              _visibilityCallbacks.delete(entry.target)
            }
          }
        })
      },
      { threshold: 0.15 }
    )
  }
  return _sharedObserver
}

function BentoCard({ feature, className = "" }: { feature: Feature; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = feature.icon;

  useEffect(() => {
    const el = ref.current
    if (!el) return
    _visibilityCallbacks.set(el, () => setIsVisible(true))
    getSharedObserver().observe(el)
    return () => {
      getSharedObserver().unobserve(el)
      _visibilityCallbacks.delete(el)
    }
  }, []);

  const isDark = feature.dark;

  return (
    <div
      ref={ref}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${
        isDark
          ? "bg-[#0d1b2e] text-white"
          : "bg-white text-[#1a2535] border border-gray-100/80"
      } ${className}`}
    >
      {/* Hover overlay */}
      <div className={`absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${
        isDark ? "bg-white/[0.03]" : "bg-[#0a5ab3]/[0.02]"
      }`} />

      <div className="relative p-7 lg:p-8 h-full flex flex-col">
        {feature.tag && (
          <span className="inline-flex self-start text-[11px] font-bold bg-[#69B531] text-white px-3.5 py-1.5 rounded-full shadow-[0_2px_8px_rgba(105,181,49,0.3)] uppercase tracking-wider mb-5">
            {feature.tag}
          </span>
        )}

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 ${
          isDark
            ? "bg-white/[0.08]"
            : "bg-gradient-to-br from-[#0a5ab3]/10 to-[#0a5ab3]/5"
        }`}>
          <Icon className={`w-7 h-7 ${isDark ? "text-[#69B531]" : "text-[#0a5ab3]"}`} />
        </div>

        <h3 className={`font-display text-xl font-bold mb-3 ${isDark ? "text-white" : "text-[#1a2535]"}`}>
          {feature.title}
        </h3>
        <p className={`text-[14px] leading-[1.7] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {feature.description}
        </p>

        {/* Feature-specific visual detail for large card */}
        {feature.size === "large" && (
          <div className="mt-6 flex-1 flex items-end">
            <div className="w-full bg-gray-50/80 rounded-xl p-4 border border-gray-100/60">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#0a5ab3]/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#0a5ab3]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#1a2535]">Rx #1247</p>
                  <p className="text-[9px] text-gray-400">Dr. Ahmed Khan • Mar 15, 2026</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  { drug: "Amoxicillin 500mg", dose: "1 tab × 3 daily" },
                  { drug: "Omeprazole 20mg", dose: "1 tab before meals" },
                ].map((rx, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-[10px] font-medium text-[#1a2535]">{rx.drug}</span>
                    <span className="text-[9px] text-gray-400">{rx.dose}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Features() {
  const [digitalRx, smartAppts, patientRecords, multiDoctor, revenue, secure] = FEATURES as [Feature, Feature, Feature, Feature, Feature, Feature]
  return (
    <section id="features" className="relative bg-[#f8fafc] py-24 lg:py-32">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-16 lg:mb-20">
          <p className="text-[#69B531] text-[13px] font-semibold uppercase tracking-[0.15em] mb-4">
            Features
          </p>
          <h2 className="font-display text-[2.25rem] lg:text-[3rem] font-extrabold text-[#1a2535] mb-5 tracking-tight">
            Everything Your Clinic{" "}
            <span className="gradient-text">Needs</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Purpose-built for Pakistani clinics — simple enough for day one, powerful
            enough to grow with you.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 auto-rows-auto">
          {/* Large card — spans 2 cols */}
          <BentoCard
            feature={digitalRx}
            className="md:col-span-2 lg:col-span-2 shadow-premium hover:shadow-premium-hover"
          />
          {/* Medium card */}
          <BentoCard
            feature={smartAppts}
            className="shadow-premium hover:shadow-premium-hover"
          />
          {/* Medium dark */}
          <BentoCard
            feature={patientRecords}
            className="shadow-premium hover:shadow-premium-hover"
          />
          {/* Small cards */}
          <BentoCard
            feature={multiDoctor}
            className="shadow-premium hover:shadow-premium-hover"
          />
          <BentoCard
            feature={revenue}
            className="shadow-premium hover:shadow-premium-hover"
          />
        </div>

        {/* Full-width secure card */}
        <div className="mt-5 lg:mt-6">
          <BentoCard
            feature={secure}
            className="shadow-premium hover:shadow-premium-hover"
          />
        </div>
      </div>
    </section>
  );
}
