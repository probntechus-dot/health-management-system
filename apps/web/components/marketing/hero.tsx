"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const TRUST_BADGES = ["No setup fees", "Free 14-day trial", "Cancel anytime"];

const CITIES = ["Lahore", "Karachi", "Islamabad", "Faisalabad", "Rawalpindi", "Multan", "Peshawar", "Quetta"];

export default function Hero() {
  return (
    <section className="hero-mesh relative overflow-hidden min-h-screen flex items-center">
      {/* Animated gradient mesh background */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
        <div className="mesh-orb mesh-orb-4" />
        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-32 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left: Editorial Typography — 7 cols */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2.5 bg-white/[0.06] text-white/90 text-[13px] font-semibold rounded-full px-5 py-2.5 border border-white/[0.1] backdrop-blur-md tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#69B531] flex-shrink-0 animate-pulse" />
              Pakistan&apos;s #1 Clinic Management Platform
            </div>

            <div className="space-y-6">
              <h1 className="font-display text-[3rem] sm:text-[3.5rem] lg:text-[4rem] xl:text-[5rem] font-extrabold text-white leading-[1.05] tracking-[-0.03em]">
                Smarter<br className="hidden sm:block" /> Clinics,{" "}
                <span className="gradient-text-hero inline-block">
                  Healthier
                </span>
                <br />
                <span className="text-white/90">Patients</span>
              </h1>

              <p className="text-blue-100/80 text-lg lg:text-xl leading-[1.7] max-w-xl">
                The all-in-one platform for modern clinics — manage appointments,
                patients, prescriptions, and your entire team from one powerful dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/contact"
                className="btn-premium group inline-flex items-center gap-2.5 bg-[#69B531] text-white font-semibold px-8 py-4 rounded-xl shadow-[0_4px_20px_rgba(105,181,49,0.4)] hover:shadow-[0_8px_30px_rgba(105,181,49,0.5)] min-h-0 text-[15px]"
              >
                Book a Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="#how-it-works"
                className="btn-premium inline-flex items-center gap-2.5 bg-white/[0.06] text-white font-semibold px-8 py-4 rounded-xl border border-white/[0.12] backdrop-blur-sm min-h-0 text-[15px] hover:bg-white/[0.12]"
              >
                See How It Works
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2">
              {TRUST_BADGES.map((badge) => (
                <div key={badge} className="flex items-center gap-2.5 text-blue-100/70 text-[14px]">
                  <CheckCircle className="w-[18px] h-[18px] text-[#69B531] flex-shrink-0" />
                  {badge}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Premium Dashboard Mockup — 5 cols */}
          <div className="lg:col-span-5 hidden lg:block">
            <DashboardMockup />
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-20 pt-10 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <p className="text-blue-200/50 text-[13px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap">
              Trusted by 50+ clinics across
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {CITIES.map((city) => (
                <span key={city} className="text-white/50 text-[13px] font-medium px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03]">
                  {city}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Premium dashboard mockup with realistic data */
function DashboardMockup() {
  const appointments = [
    { name: "Sara Khan", time: "09:00 AM", type: "Follow-up", status: "Confirmed", color: "#69B531" },
    { name: "Ahmed Ali", time: "09:30 AM", type: "New Patient", status: "Waiting", color: "#f59e0b" },
    { name: "Fatima Malik", time: "10:00 AM", type: "Check-up", status: "Confirmed", color: "#69B531" },
    { name: "Usman Raza", time: "10:30 AM", type: "Lab Results", status: "In Progress", color: "#0a5ab3" },
    { name: "Hira Nawaz", time: "11:00 AM", type: "Consultation", status: "Confirmed", color: "#69B531" },
  ];

  return (
    <div className="relative animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
      {/* Background glow */}
      <div className="absolute -inset-8 bg-gradient-to-br from-[#0a5ab3]/20 via-transparent to-[#69B531]/10 rounded-[2rem] blur-2xl opacity-60" />
      
      {/* Main card with perspective tilt */}
      <div className="relative bg-white/[0.97] backdrop-blur-xl rounded-[1.25rem] shadow-[0_32px_64px_rgba(0,0,0,0.2),0_8px_20px_rgba(0,0,0,0.12)] border border-white/40 overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-5 py-3.5 bg-gray-50/80 border-b border-gray-100">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-gray-200/60 rounded-md px-4 py-1 text-[10px] text-gray-400 font-medium">
              clinic.probntech.com/dashboard
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* Dashboard header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-[0.12em]">
                Today&apos;s Overview
              </p>
              <p className="font-display text-[15px] font-bold text-[#1a2535] mt-1">
                Good Morning, Dr. Ahmed
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0a5ab3] to-[#084d9e] flex items-center justify-center text-white text-[11px] font-bold">
              DA
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[
              { label: "Appointments", value: "24", trend: "+12%", color: "#0a5ab3" },
              { label: "Patients", value: "18", trend: "+8%", color: "#69B531" },
              { label: "Revenue", value: "₨45K", trend: "+18%", color: "#f59e0b" },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50/80 rounded-xl p-3 text-center">
                <p className="font-display text-[18px] font-extrabold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5 font-medium uppercase tracking-wide">{stat.label}</p>
                <p className="text-[9px] font-semibold text-[#69B531] mt-0.5">{stat.trend}</p>
              </div>
            ))}
          </div>

          {/* Mini chart (CSS bars) */}
          <div className="mb-5 p-3 bg-gray-50/60 rounded-xl">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Weekly Visits</p>
            <div className="flex items-end gap-1.5 h-10">
              {[40, 65, 50, 80, 72, 90, 60].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm transition-all duration-500"
                  style={{
                    height: `${h}%`,
                    background: i === 5 ? 'linear-gradient(180deg, #0a5ab3, #084d9e)' : '#e2e8f0',
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i} className="text-[8px] text-gray-300 flex-1 text-center">{d}</span>
              ))}
            </div>
          </div>

          {/* Appointments list */}
          <div>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-2">
              Upcoming Appointments
            </p>
            <div className="space-y-1">
              {appointments.map((appt, idx) => (
                <div
                  key={appt.name}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50/80 transition-all duration-300"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0a5ab3]/15 to-[#0a5ab3]/5 flex items-center justify-center text-[#0a5ab3] text-[10px] font-bold flex-shrink-0">
                    {appt.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[#1a2535] truncate">{appt.name}</p>
                    <p className="text-[9px] text-gray-400">{appt.time} · {appt.type}</p>
                  </div>
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: appt.color + "15", color: appt.color }}
                  >
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification card — top right */}
      <div className="absolute -top-4 -right-6 z-10 bg-white rounded-xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100/80 animate-float">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#69B531]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#69B531]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Prescriptions</p>
            <p className="text-[13px] font-bold text-[#1a2535]">+12 <span className="text-[10px] font-medium text-gray-400">today</span></p>
          </div>
        </div>
      </div>

      {/* Floating revenue card — bottom left */}
      <div className="absolute -bottom-3 -left-6 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-4 py-3 border border-gray-100/60 animate-float-delayed">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0a5ab3]/8 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#0a5ab3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Monthly Revenue</p>
            <p className="font-display text-[14px] font-bold text-[#0a5ab3]">PKR 2.4M</p>
            <p className="text-[9px] text-[#69B531] font-semibold">↑ 18% this month</p>
          </div>
        </div>
      </div>
    </div>
  );
}
