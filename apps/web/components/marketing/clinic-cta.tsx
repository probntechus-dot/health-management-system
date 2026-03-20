"use client";

import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const TESTIMONIALS = [
  {
    quote: "ClinicPro transformed how we operate. Patient satisfaction is up 40%, and our team saves 10 hours per week.",
    author: "Dr. Ayesha Malik",
    role: "Director, MediCare Clinic Lahore",
  },
  {
    quote: "Finally, a platform that understands Pakistani clinics. Setup took 20 minutes, not 2 weeks.",
    author: "Dr. Hassan Raza",
    role: "Founder, City Health Karachi",
  },
  {
    quote: "Our revenue tracking alone justified the switch. We see everything in real time now.",
    author: "Dr. Sana Ahmed",
    role: "Medical Director, PrimaCare Islamabad",
  },
];

function FloatingTestimonial({ testimonial, index }: { testimonial: typeof TESTIMONIALS[0]; index: number }) {
  return (
    <div
      className="testimonial-float bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 max-w-sm"
      style={{
        animationDelay: `${index * 2}s`,
        animationDuration: `${20 + index * 5}s`,
      }}
    >
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-3.5 h-3.5 text-[#69B531] fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
          </svg>
        ))}
      </div>
      <p className="text-white/80 text-[13px] leading-[1.7] mb-4 italic">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-white font-bold text-[12px] border border-white/10">
          {testimonial.author.split(" ").map(w => w[0]).join("").slice(0, 2)}
        </div>
        <div>
          <p className="text-white font-semibold text-[13px]">{testimonial.author}</p>
          <p className="text-blue-200/50 text-[11px]">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}

export default function ClinicCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="for-clinics"
      className="cta-mesh relative overflow-hidden py-24 lg:py-32"
    >
      {/* Animated gradient mesh */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="mesh-orb mesh-orb-1" style={{ opacity: 0.15 }} />
        <div className="mesh-orb mesh-orb-2" style={{ opacity: 0.1 }} />
        <div className="mesh-orb mesh-orb-3" style={{ opacity: 0.12 }} />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered dramatic headline */}
        <div className={`text-center mb-16 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <p className="text-[#a8d96b] text-[13px] font-semibold uppercase tracking-[0.15em] mb-6">
            For Clinics
          </p>
          <h2 className="font-display text-[2.5rem] lg:text-[3.5rem] xl:text-[4rem] font-extrabold text-white leading-[1.1] mb-6 tracking-tight max-w-3xl mx-auto">
            Ready to{" "}
            <span className="gradient-text-hero">Modernise</span>
            <br />Your Clinic?
          </h2>
          <p className="text-blue-100/60 text-lg lg:text-xl leading-[1.7] max-w-2xl mx-auto mb-10">
            Join 50+ clinics across Pakistan already using ClinicPro to streamline
            operations and deliver better patient care.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="btn-premium group inline-flex items-center gap-2.5 bg-[#69B531] text-white font-semibold px-10 py-4 rounded-xl glow-green min-h-0 text-[16px]"
            >
              Book a Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="tel:+923001234567"
              className="btn-premium inline-flex items-center gap-2.5 bg-white/[0.06] text-white font-semibold px-10 py-4 rounded-xl border border-white/[0.1] backdrop-blur-sm min-h-0 text-[16px] hover:bg-white/[0.12]"
            >
              <Phone className="w-5 h-5" />
              Talk to Sales
            </a>
          </div>
        </div>

        {/* Floating testimonials */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FloatingTestimonial key={i} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
