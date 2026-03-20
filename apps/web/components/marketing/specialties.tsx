import {
  Stethoscope,
  Heart,
  Baby,
  Smile,
  Eye,
  Bone,
  Brain,
  Pill,
  Activity,
  Syringe,
  type LucideIcon,
} from "lucide-react";

interface Specialty {
  name: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const SPECIALTIES_ROW1: Specialty[] = [
  { name: "General Physician", icon: Stethoscope, color: "#0a5ab3", bg: "#e8f0fc" },
  { name: "Cardiologist",      icon: Heart,        color: "#e53935", bg: "#fdecea" },
  { name: "Pediatrician",      icon: Baby,         color: "#f59e0b", bg: "#fef3c7" },
  { name: "Dentist",           icon: Smile,        color: "#0891b2", bg: "#e0f2fe" },
  { name: "Eye Specialist",    icon: Eye,          color: "#7c3aed", bg: "#ede9fe" },
  { name: "Orthopedic",        icon: Bone,         color: "#059669", bg: "#d1fae5" },
  { name: "General Physician", icon: Stethoscope, color: "#0a5ab3", bg: "#e8f0fc" },
  { name: "Cardiologist",      icon: Heart,        color: "#e53935", bg: "#fdecea" },
  { name: "Pediatrician",      icon: Baby,         color: "#f59e0b", bg: "#fef3c7" },
  { name: "Dentist",           icon: Smile,        color: "#0891b2", bg: "#e0f2fe" },
  { name: "Eye Specialist",    icon: Eye,          color: "#7c3aed", bg: "#ede9fe" },
  { name: "Orthopedic",        icon: Bone,         color: "#059669", bg: "#d1fae5" },
];

const SPECIALTIES_ROW2: Specialty[] = [
  { name: "Neurologist",       icon: Brain,        color: "#db2777", bg: "#fce7f3" },
  { name: "Dermatologist",     icon: Pill,         color: "#65a30d", bg: "#ecfccb" },
  { name: "Gynecologist",      icon: Activity,     color: "#ea580c", bg: "#ffedd5" },
  { name: "Surgeon",           icon: Syringe,      color: "#dc2626", bg: "#fee2e2" },
  { name: "ENT Specialist",    icon: Stethoscope,  color: "#0284c7", bg: "#e0f2fe" },
  { name: "Psychiatrist",      icon: Brain,        color: "#6d28d9", bg: "#ede9fe" },
  { name: "Neurologist",       icon: Brain,        color: "#db2777", bg: "#fce7f3" },
  { name: "Dermatologist",     icon: Pill,         color: "#65a30d", bg: "#ecfccb" },
  { name: "Gynecologist",      icon: Activity,     color: "#ea580c", bg: "#ffedd5" },
  { name: "Surgeon",           icon: Syringe,      color: "#dc2626", bg: "#fee2e2" },
  { name: "ENT Specialist",    icon: Stethoscope,  color: "#0284c7", bg: "#e0f2fe" },
  { name: "Psychiatrist",      icon: Brain,        color: "#6d28d9", bg: "#ede9fe" },
];

function MarqueeCard({ sp }: { sp: Specialty }) {
  const Icon = sp.icon;
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl px-6 py-5 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex-shrink-0 w-[220px] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: sp.bg }}
      >
        <Icon className="w-6 h-6" style={{ color: sp.color }} />
      </div>
      <p className="text-[14px] font-semibold text-[#1a2535] leading-tight">
        {sp.name}
      </p>
    </div>
  );
}

export default function Specialties() {
  return (
    <section id="specialties" className="relative bg-[#f8fafc] py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14 lg:mb-20">
        {/* Section header */}
        <div className="text-center">
          <p className="text-[#69B531] text-[13px] font-semibold uppercase tracking-[0.15em] mb-4">
            Specialties
          </p>
          <h2 className="font-display text-[2.25rem] lg:text-[3rem] font-extrabold text-[#1a2535] mb-5 tracking-tight">
            All Specialties,{" "}
            <span className="gradient-text">One Platform</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Whether you run a general clinic or a specialist practice, ClinicPro
            adapts to your workflow.
          </p>
        </div>
      </div>

      {/* Marquee Row 1 — scrolling left */}
      <div className="marquee-container mb-4">
        <div className="marquee-track">
          <div className="flex gap-4 marquee-scroll">
            {SPECIALTIES_ROW1.map((sp, i) => (
              <MarqueeCard key={`r1-${i}`} sp={sp} />
            ))}
          </div>
          <div className="flex gap-4 marquee-scroll" aria-hidden>
            {SPECIALTIES_ROW1.map((sp, i) => (
              <MarqueeCard key={`r1d-${i}`} sp={sp} />
            ))}
          </div>
        </div>
      </div>

      {/* Marquee Row 2 — scrolling right */}
      <div className="marquee-container">
        <div className="marquee-track-reverse">
          <div className="flex gap-4 marquee-scroll-reverse">
            {SPECIALTIES_ROW2.map((sp, i) => (
              <MarqueeCard key={`r2-${i}`} sp={sp} />
            ))}
          </div>
          <div className="flex gap-4 marquee-scroll-reverse" aria-hidden>
            {SPECIALTIES_ROW2.map((sp, i) => (
              <MarqueeCard key={`r2d-${i}`} sp={sp} />
            ))}
          </div>
        </div>
      </div>

      {/* Edge fades */}
      <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-[#f8fafc] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-[#f8fafc] to-transparent z-10 pointer-events-none" />
    </section>
  );
}
