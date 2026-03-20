import Link from "next/link";
import { Stethoscope, Clock, Users, Headphones, CheckCircle, Phone, Mail, MapPin } from "lucide-react";
import Navbar from "@/components/marketing/navbar"
import Footer from "@/components/marketing/footer"
import DemoForm from "./DemoForm";

const WHAT_TO_EXPECT = [
  { icon: Clock,       text: "30-minute live walkthrough of ClinicPro" },
  { icon: Users,       text: "Tailored to your clinic size and specialty" },
  { icon: Headphones,  text: "Live Q&A with our onboarding team" },
  { icon: CheckCircle, text: "No obligation — no credit card required" },
];

const CONTACT_DETAILS = [
  { icon: Phone,  text: "+92 300 123 4567",  href: "tel:+923001234567" },
  { icon: Mail,   text: "hello@clinicpro.pk", href: "mailto:hello@clinicpro.pk" },
  { icon: MapPin, text: "Lahore, Pakistan",   href: null },
];

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      {/* Page hero */}
      <section className="bg-gradient-to-br from-[#0a5ab3] to-[#073f82] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-medium rounded-full px-4 py-1.5 mb-5 border border-white/20">
            <Stethoscope className="w-4 h-4" />
            Free, No-Obligation Demo
          </div>
          <h1 className="font-display text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            See ClinicPro in Action
          </h1>
          <p className="text-blue-100 text-base lg:text-lg max-w-xl mx-auto">
            Book a free 30-minute personalised demo with our team and discover how
            ClinicPro can transform your clinic.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="flex-1 py-14 lg:py-20 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">

            {/* Left: info panel (2 of 5 cols) */}
            <div className="lg:col-span-2 space-y-8">

              {/* What to expect */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-[#1a2535] mb-5">
                  What to Expect
                </h2>
                <ul className="space-y-4">
                  {WHAT_TO_EXPECT.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#e8f0fc] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-[#0a5ab3]" />
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-[#1a2535] mb-5">
                  Prefer to Call?
                </h2>
                <ul className="space-y-3.5">
                  {CONTACT_DETAILS.map(({ icon: Icon, text, href }) => (
                    <li key={text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#e8f0fc] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#0a5ab3]" />
                      </div>
                      {href ? (
                        <a
                          href={href}
                          className="text-sm text-gray-700 font-medium hover:text-[#0a5ab3] transition-colors min-h-0"
                        >
                          {text}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-700 font-medium">{text}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Already have an account? */}
              <p className="text-sm text-gray-500 text-center">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#0a5ab3] hover:underline min-h-0"
                >
                  Log in here
                </Link>
              </p>
            </div>

            {/* Right: form (3 of 5 cols) */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
              <h2 className="font-display text-xl font-bold text-[#1a2535] mb-1">
                Book Your Free Demo
              </h2>
              <p className="text-sm text-gray-500 mb-7">
                Fill in your details and we&apos;ll get back to you within 24 hours.
              </p>
              <DemoForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
