import Link from "next/link";
import { Stethoscope, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ArrowRight } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Specialties", href: "#specialties" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Security", href: "#security" },
  ],
  Company: [
    { label: "About Us", href: "#about" },
    { label: "Blog", href: "#blog" },
    { label: "Careers", href: "#careers" },
    { label: "Press", href: "#press" },
  ],
  Support: [
    { label: "Help Center", href: "#help" },
    { label: "Documentation", href: "#docs" },
    { label: "System Status", href: "#status" },
    { label: "Contact Support", href: "#contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Terms of Service", href: "#terms" },
    { label: "Cookie Policy", href: "#cookies" },
  ],
};

const CONTACT = [
  { icon: Phone, text: "+92 300 123 4567", href: "tel:+923001234567" },
  { icon: Mail, text: "hello@clinicpro.pk", href: "mailto:hello@clinicpro.pk" },
  { icon: MapPin, text: "Lahore, Pakistan", href: "#" },
];

const SOCIAL_LINKS = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Instagram, href: "#", label: "Instagram" },
];

export default function Footer() {
  return (
    <footer className="footer-premium text-gray-300">
      {/* Gradient border at top */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#0a5ab3]/40 to-transparent" />

      {/* Mini CTA bar */}
      <div className="border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-2xl lg:text-3xl font-bold text-white mb-2">
                Ready to get started?
              </h3>
              <p className="text-gray-400 text-[15px]">
                Set up your clinic in under an hour. No credit card required.
              </p>
            </div>
            <Link
              href="/contact"
              className="btn-premium group inline-flex items-center gap-2.5 bg-[#0a5ab3] text-white font-semibold px-8 py-4 rounded-xl glow-blue min-h-0 text-[15px] flex-shrink-0"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 lg:gap-12">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6 min-h-0 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0a5ab3] to-[#084d9e] flex items-center justify-center flex-shrink-0 group-hover:shadow-lg group-hover:shadow-[#0a5ab3]/30 transition-all duration-300">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-extrabold text-[20px] text-white tracking-tight">
                ClinicPro
              </span>
            </Link>

            <p className="text-[14px] text-gray-400/80 leading-[1.7] mb-7 max-w-xs">
              Pakistan&apos;s #1 clinic management platform — helping healthcare
              professionals deliver better patient care every day.
            </p>

            {/* Contact info */}
            <div className="space-y-3 mb-7">
              {CONTACT.map(({ icon: Icon, text, href }) => (
                <a
                  key={text}
                  href={href}
                  className="flex items-center gap-3 text-[13px] text-gray-400/80 hover:text-white transition-colors duration-300 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.08] transition-all duration-300">
                    <Icon className="w-4 h-4 text-[#69B531]" />
                  </div>
                  {text}
                </a>
              ))}
            </div>

            {/* Social links */}
            <div className="flex gap-2.5">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center hover:bg-[#0a5ab3] transition-all duration-300 group"
                >
                  <Icon className="w-[18px] h-[18px] text-gray-500 group-hover:text-white transition-colors duration-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display text-[13px] font-semibold text-white uppercase tracking-[0.12em] mb-6">
                {category}
              </h4>
              <ul className="space-y-3.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-gray-400/70 hover:text-white transition-colors duration-300 min-h-0 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-gray-500/60">
            &copy; {new Date().getFullYear()} ClinicPro by Probntech. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <Link href="#privacy" className="text-[12px] text-gray-500/60 hover:text-gray-300 transition-colors duration-300 min-h-0">
              Privacy
            </Link>
            <Link href="#terms" className="text-[12px] text-gray-500/60 hover:text-gray-300 transition-colors duration-300 min-h-0">
              Terms
            </Link>
            <Link href="#cookies" className="text-[12px] text-gray-500/60 hover:text-gray-300 transition-colors duration-300 min-h-0">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
