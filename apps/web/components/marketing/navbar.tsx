"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Stethoscope } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Specialties", href: "#specialties" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "/pricing" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { threshold: 0.3 }
    );

    NAV_LINKS.forEach((link) => {
      if (!link.href.startsWith("#")) return;
      const element = document.querySelector(link.href);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white border-b border-gray-200/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 min-h-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0a5ab3] to-[#084d9e] flex items-center justify-center flex-shrink-0 group-hover:shadow-lg group-hover:shadow-[#0a5ab3]/20 transition-all duration-300">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className={`font-display font-extrabold text-[22px] tracking-tight transition-colors duration-500 ${
              scrolled ? "text-[#0a5ab3]" : "text-white"
            }`}>
              ClinicPro
            </span>
          </Link>

          {/* Desktop navigation links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isPage = !link.href.startsWith("#");
              const baseClass = `text-[14px] font-medium px-4 py-2 rounded-lg transition-all duration-300 min-h-0 relative ${
                scrolled
                  ? activeSection === link.href
                    ? "text-[#0a5ab3] bg-[#0a5ab3]/5"
                    : "text-gray-500 hover:text-[#1a2535] hover:bg-gray-50"
                  : activeSection === link.href
                    ? "text-white bg-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/5"
              }`;
              const indicator = activeSection === link.href && (
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full ${
                  scrolled ? "bg-[#0a5ab3]" : "bg-white"
                }`} />
              );

              return isPage ? (
                <Link key={link.href} href={link.href} className={baseClass}>
                  {link.label}
                  {indicator}
                </Link>
              ) : (
                <button key={link.href} onClick={() => handleNavClick(link.href)} className={baseClass}>
                  {link.label}
                  {indicator}
                </button>
              );
            })}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className={`text-[14px] font-semibold rounded-xl px-5 py-2.5 transition-all duration-300 min-h-0 ${
                scrolled
                  ? "text-[#0a5ab3] border border-[#0a5ab3]/20 hover:bg-[#0a5ab3]/5 hover:border-[#0a5ab3]/40"
                  : "text-white border border-white/20 hover:bg-white/10 hover:border-white/40"
              }`}
            >
              Log In
            </Link>
            <Link
              href="/contact"
              className="btn-premium text-[14px] font-semibold bg-[#0a5ab3] text-white rounded-xl px-6 py-2.5 shadow-[0_2px_8px_rgba(10,90,179,0.3)] hover:shadow-[0_4px_16px_rgba(10,90,179,0.4)] min-h-0"
            >
              Book a Demo
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-xl transition-colors duration-300 min-h-0 ${
              scrolled ? "text-gray-600 hover:bg-gray-100" : "text-white hover:bg-white/10"
            }`}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-gray-100 bg-white/98 backdrop-blur-xl px-4 pb-5 pt-3">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const mobileClass = "py-3 px-3 text-[15px] font-medium text-gray-700 hover:text-[#0a5ab3] hover:bg-[#0a5ab3]/5 rounded-xl transition-all duration-300 text-left";
              return link.href.startsWith("#") ? (
                <button key={link.href} onClick={() => handleNavClick(link.href)} className={mobileClass}>
                  {link.label}
                </button>
              ) : (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={`block ${mobileClass}`}>
                  {link.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-2.5 mt-3 pt-4 border-t border-gray-100">
              <Link
                href="/login"
                className="text-center py-3 border border-[#0a5ab3]/20 text-[#0a5ab3] rounded-xl text-[15px] font-semibold hover:bg-[#0a5ab3]/5 transition-all duration-300"
              >
                Log In
              </Link>
              <Link
                href="/contact"
                className="text-center py-3 bg-[#0a5ab3] text-white rounded-xl text-[15px] font-semibold shadow-[0_2px_8px_rgba(10,90,179,0.3)]"
              >
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
