"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ArrowRight,
  Phone,
  Users,
  Building2,
  Shield,
  Zap,
  Star,
  ChevronDown,
  Stethoscope,
  CheckCircle,
  CreditCard,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/marketing/navbar"
import Footer from "@/components/marketing/footer"

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const PLANS = [
  {
    name: "Starter",
    subtitle: "For solo practitioners",
    price: "4,999",
    period: "/month",
    icon: Stethoscope,
    popular: false,
    dark: false,
    cta: "Start Free Trial",
    features: [
      "1 Doctor",
      "1 Receptionist",
      "Digital Prescriptions",
      "Patient Records",
      "Patient Queue Management",
      "WhatsApp Support",
    ],
  },
  {
    name: "Clinic",
    subtitle: "Most popular for clinics",
    price: "9,999",
    period: "/month",
    icon: Building2,
    popular: true,
    dark: true,
    cta: "Start Free Trial",
    features: [
      "Up to 5 Doctors",
      "Unlimited Receptionists",
      "Digital Prescriptions",
      "Patient Records",
      "Patient Queue Management",
      "Clinic Analytics & Reports",
      "Custom Prescription Header",
      "Priority WhatsApp Support",
    ],
  },
  {
    name: "Enterprise",
    subtitle: "For hospitals & chains",
    price: "Custom",
    period: "",
    icon: Users,
    popular: false,
    dark: false,
    cta: "Contact Sales",
    features: [
      "Unlimited Doctors",
      "Unlimited Staff",
      "Everything in Clinic",
      "Multi-Branch Management",
      "Dedicated Account Manager",
      "Custom Integrations",
      "On-Site Training",
      "SLA & Uptime Guarantee",
    ],
  },
];

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes! Every plan comes with a 14-day free trial. No credit card needed — just sign up and start using ClinicPro right away.",
  },
  {
    q: "Can I change my plan later?",
    a: "Absolutely. You can upgrade or downgrade anytime from your settings. Changes take effect immediately and billing is prorated.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept JazzCash, Easypaisa, bank transfer, and all major debit/credit cards. We also support monthly invoicing for Enterprise plans.",
  },
  {
    q: "Is my clinic data safe?",
    a: "Your data is encrypted at rest and in transit. We use enterprise-grade PostgreSQL databases with daily backups. Your patient data never leaves Pakistan.",
  },
  {
    q: "Do you offer discounts for annual billing?",
    a: "Yes — pay annually and get 2 months free on any plan. That\u0027s up to 17% savings.",
  },
  {
    q: "Can I get help setting things up?",
    a: "Of course! Our team will help you set up your clinic, import existing patient data, and train your staff — all included at no extra cost.",
  },
];

const TRUST_POINTS = [
  { icon: Shield, text: "Data stays in Pakistan" },
  { icon: Zap, text: "Setup in under 1 hour" },
  { icon: Star, text: "14-day free trial" },
  { icon: CreditCard, text: "JazzCash & Easypaisa" },
];

/* ------------------------------------------------------------------ */
/*  Animated section wrapper                                           */
/* ------------------------------------------------------------------ */

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ Accordion Item                                                 */
/* ------------------------------------------------------------------ */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left bg-white rounded-2xl border border-gray-100/80 shadow-premium hover:shadow-premium-hover transition-all duration-300 overflow-hidden group"
    >
      <div className="flex items-center justify-between gap-4 p-6">
        <h3 className="font-display text-[15px] font-semibold text-[#1a2535] group-hover:text-[#0a5ab3] transition-colors duration-300">
          {q}
        </h3>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
            open ? "rotate-180 text-[#0a5ab3]" : ""
          }`}
        />
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-40 pb-6" : "max-h-0"
        }`}
      >
        <p className="text-[14px] text-gray-500 leading-[1.7] px-6">{a}</p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col public-layout">
      <Navbar />

      {/* ============================================================ */}
      {/*  Hero — dark mesh background matching home page              */}
      {/* ============================================================ */}
      <section className="hero-mesh relative overflow-hidden min-h-screen flex items-center">
        {/* Animated gradient orbs */}
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="mesh-orb mesh-orb-1" />
          <div className="mesh-orb mesh-orb-2" />
          <div className="mesh-orb mesh-orb-3" />
          <div className="mesh-orb mesh-orb-4" />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 bg-white/[0.06] text-white/90 text-[13px] font-semibold rounded-full px-5 py-2.5 border border-white/[0.1] backdrop-blur-md tracking-wide mb-8">
            <span className="w-2 h-2 rounded-full bg-[#69B531] flex-shrink-0 animate-pulse" />
            Simple, Transparent Pricing
          </div>

          {/* Headline */}
          <h1 className="font-display text-[2.75rem] sm:text-[3.5rem] lg:text-[4.25rem] font-extrabold text-white leading-[1.08] tracking-[-0.03em] mb-6">
            Plans That Grow{" "}
            <br className="hidden sm:block" />
            With Your{" "}
            <span className="gradient-text-hero inline-block">Practice</span>
          </h1>

          <p className="text-blue-100/70 text-lg lg:text-xl leading-[1.7] max-w-2xl mx-auto mb-12">
            Start free for 14 days. No credit card required. Cancel anytime.
            <br className="hidden sm:block" />
            Affordable pricing designed for Pakistani clinics.
          </p>

          {/* Trust points */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {TRUST_POINTS.map(({ text }) => (
              <div
                key={text}
                className="flex items-center gap-2.5 text-blue-100/70 text-[14px]"
              >
                <CheckCircle className="w-[18px] h-[18px] text-[#69B531] flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>


      </section>

      {/* ============================================================ */}
      {/*  Pricing Cards                                               */}
      {/* ============================================================ */}
      <section className="relative bg-[#f8fafc] pt-8 pb-24 lg:pt-12 lg:pb-32">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Cards grid */}
          <div className="grid md:grid-cols-3 gap-5 lg:gap-6 -mt-16 relative z-10">
            {PLANS.map((plan, idx) => {
              const Icon = plan.icon;
              return (
                <AnimatedSection key={plan.name} delay={idx * 120}>
                  <div
                    className={`relative rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-500 group ${
                      plan.dark
                        ? "bg-[#0d1b2e] text-white shadow-[0_32px_64px_rgba(0,0,0,0.15),0_8px_20px_rgba(0,0,0,0.1)]"
                        : "bg-white text-[#1a2535] border border-gray-100/80 shadow-premium hover:shadow-premium-hover"
                    } hover:-translate-y-2`}
                  >
                    {/* Hover overlay */}
                    <div
                      className={`absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${
                        plan.dark ? "bg-white/[0.02]" : "bg-[#0a5ab3]/[0.015]"
                      }`}
                    />

                    {/* Popular badge */}
                    {plan.popular && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#69B531] via-[#0a5ab3] to-[#69B531]" />
                    )}

                    <div className="relative p-7 lg:p-8 flex flex-col h-full">
                      {/* Badge */}
                      {plan.popular && (
                        <span className="inline-flex self-start text-[11px] font-bold bg-[#69B531] text-white px-3.5 py-1.5 rounded-full shadow-[0_2px_8px_rgba(105,181,49,0.3)] uppercase tracking-wider mb-5">
                          Most Popular
                        </span>
                      )}

                      {/* Icon */}
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 ${
                          plan.dark
                            ? "bg-white/[0.08]"
                            : "bg-gradient-to-br from-[#0a5ab3]/10 to-[#0a5ab3]/5"
                        }`}
                      >
                        <Icon
                          className={`w-7 h-7 ${
                            plan.dark ? "text-[#69B531]" : "text-[#0a5ab3]"
                          }`}
                        />
                      </div>

                      {/* Name & subtitle */}
                      <h3
                        className={`font-display text-xl font-bold mb-1 ${
                          plan.dark ? "text-white" : "text-[#1a2535]"
                        }`}
                      >
                        {plan.name}
                      </h3>
                      <p
                        className={`text-[14px] mb-6 ${
                          plan.dark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {plan.subtitle}
                      </p>

                      {/* Price */}
                      <div className="mb-8">
                        {plan.price === "Custom" ? (
                          <span
                            className={`font-display text-[2.5rem] font-extrabold tracking-tight ${
                              plan.dark ? "text-white" : "text-[#1a2535]"
                            }`}
                          >
                            Custom
                          </span>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className={`text-[14px] font-medium ${
                                plan.dark ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              PKR
                            </span>
                            <span
                              className={`font-display text-[2.75rem] font-extrabold tracking-tight leading-none ${
                                plan.dark ? "text-white" : "text-[#1a2535]"
                              }`}
                            >
                              {plan.price}
                            </span>
                            <span
                              className={`text-[14px] ${
                                plan.dark ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              {plan.period}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* CTA Button */}
                      <Link
                        href="/contact"
                        className={`btn-premium w-full text-center py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-300 mb-8 block ${
                          plan.dark
                            ? "bg-[#69B531] text-white shadow-[0_4px_16px_rgba(105,181,49,0.3)] hover:shadow-[0_6px_24px_rgba(105,181,49,0.4)]"
                            : plan.popular
                              ? "bg-[#0a5ab3] text-white shadow-[0_4px_16px_rgba(10,90,179,0.3)] hover:shadow-[0_6px_24px_rgba(10,90,179,0.4)]"
                              : "bg-white text-[#0a5ab3] border-2 border-[#0a5ab3]/20 hover:border-[#0a5ab3]/50 hover:bg-[#0a5ab3]/[0.03]"
                        }`}
                      >
                        {plan.cta}
                      </Link>

                      {/* Divider */}
                      <div
                        className={`h-px mb-6 ${
                          plan.dark
                            ? "bg-white/[0.06]"
                            : "bg-gradient-to-r from-transparent via-gray-200 to-transparent"
                        }`}
                      />

                      {/* Features */}
                      <ul className="space-y-3.5 flex-1">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className={`flex items-start gap-3 text-[14px] ${
                              plan.dark ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                plan.dark
                                  ? "bg-[#69B531]/15"
                                  : "bg-[#69B531]/10"
                              }`}
                            >
                              <Check
                                className="w-3 h-3 text-[#69B531]"
                                strokeWidth={3}
                              />
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Annual discount */}
          <AnimatedSection delay={400}>
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-premium border border-gray-100/80">
                <Sparkles className="w-5 h-5 text-[#69B531]" />
                <p className="text-[14px] text-gray-600">
                  Pay annually and get{" "}
                  <span className="font-bold text-[#0a5ab3]">
                    2 months free
                  </span>{" "}
                  on any plan
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FAQs                                                        */}
      {/* ============================================================ */}
      <section className="relative bg-white py-24 lg:py-32">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-14">
              <p className="text-[#69B531] text-[13px] font-semibold uppercase tracking-[0.15em] mb-4">
                FAQs
              </p>
              <h2 className="font-display text-[2.25rem] lg:text-[3rem] font-extrabold text-[#1a2535] tracking-tight mb-4">
                Got{" "}
                <span className="gradient-text">Questions?</span>
              </h2>
              <p className="text-gray-500 text-lg max-w-lg mx-auto">
                Everything you need to know about ClinicPro pricing.
              </p>
            </div>
          </AnimatedSection>

          <div className="space-y-3">
            {FAQS.map(({ q, a }, idx) => (
              <AnimatedSection key={q} delay={idx * 80}>
                <FaqItem q={q} a={a} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Bottom CTA — mesh background                                */}
      {/* ============================================================ */}
      <section className="cta-mesh relative overflow-hidden py-24 lg:py-32">
        {/* Animated mesh */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div className="mesh-orb mesh-orb-1" style={{ opacity: 0.15 }} />
          <div className="mesh-orb mesh-orb-2" style={{ opacity: 0.1 }} />
          <div className="mesh-orb mesh-orb-3" style={{ opacity: 0.12 }} />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <p className="text-[#a8d96b] text-[13px] font-semibold uppercase tracking-[0.15em] mb-6">
              Get Started
            </p>
            <h2 className="font-display text-[2.5rem] lg:text-[3.5rem] font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Ready to{" "}
              <span className="gradient-text-hero">Modernise</span>
              <br />
              Your Clinic?
            </h2>
            <p className="text-blue-100/60 text-lg lg:text-xl leading-[1.7] max-w-2xl mx-auto mb-10">
              Join 50+ clinics across Pakistan already using ClinicPro. Start
              your free 14-day trial today.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="btn-premium group inline-flex items-center gap-2.5 bg-[#69B531] text-white font-semibold px-10 py-4 rounded-xl glow-green min-h-0 text-[16px]"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="https://wa.me/923001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-premium inline-flex items-center gap-2.5 bg-white/[0.06] text-white font-semibold px-10 py-4 rounded-xl border border-white/[0.1] backdrop-blur-sm min-h-0 text-[16px] hover:bg-white/[0.12]"
              >
                <Phone className="w-5 h-5" />
                Chat on WhatsApp
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
