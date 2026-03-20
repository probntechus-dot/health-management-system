"use client";

import { useActionState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { submitDemoRequest, type DemoRequestState } from "./actions";

const DOCTOR_COUNT_OPTIONS = [
  { value: "1", label: "Just me (solo practice)" },
  { value: "2-5", label: "2 – 5 doctors" },
  { value: "6-10", label: "6 – 10 doctors" },
  { value: "10+", label: "More than 10 doctors" },
];

const CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Hyderabad", "Sialkot", "Other",
];

export default function DemoForm() {
  const [state, formAction, isPending] = useActionState<DemoRequestState, FormData>(
    submitDemoRequest,
    null
  );

  if (state?.success) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-[#69B531]/15 flex items-center justify-center mb-5">
          <CheckCircle className="w-8 h-8 text-[#69B531]" />
        </div>
        <h3 className="font-display text-2xl font-bold text-[#1a2535] mb-2">
          Request Received!
        </h3>
        <p className="text-gray-500 text-base max-w-sm leading-relaxed">
          {state.message}
        </p>
        <a
          href="/"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0a5ab3] hover:underline min-h-0"
        >
          ← Back to Home
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Error banner */}
      {state && !state.success && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {state.message}
        </div>
      )}

      {/* Row: name + email */}
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Full Name" name="name" type="text" placeholder="Dr. Ahmed Khan" required />
        <Field label="Email Address" name="email" type="email" placeholder="ahmed@clinic.pk" required />
      </div>

      {/* Row: phone + city */}
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Phone Number" name="phone" type="tel" placeholder="+92 300 123 4567" required />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">
            City <span className="text-red-500">*</span>
          </label>
          <select
            name="city"
            required
            defaultValue=""
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:border-[#0a5ab3] focus:ring-2 focus:ring-[#0a5ab3]/20 transition-colors"
          >
            <option value="" disabled>Select your city</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row: clinic name + doctor count */}
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Clinic Name" name="clinicName" type="text" placeholder="Al-Shifa Clinic" required />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Number of Doctors</label>
          <select
            name="doctorCount"
            defaultValue=""
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:border-[#0a5ab3] focus:ring-2 focus:ring-[#0a5ab3]/20 transition-colors"
          >
            <option value="" disabled>Select range</option>
            {DOCTOR_COUNT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">
          Questions or Comments <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          name="message"
          rows={4}
          placeholder="Tell us about your clinic, current challenges, or anything you'd like to see in the demo…"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white resize-none focus:outline-none focus:border-[#0a5ab3] focus:ring-2 focus:ring-[#0a5ab3]/20 transition-colors"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-[#0a5ab3] text-white font-semibold py-3.5 rounded-xl hover:bg-[#084d9e] disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-md min-h-0"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting…
          </>
        ) : (
          "Book My Free Demo"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        No credit card required · We&apos;ll respond within 24 hours
      </p>
    </form>
  );
}

/** Reusable text input field */
function Field({
  label,
  name,
  type,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:border-[#0a5ab3] focus:ring-2 focus:ring-[#0a5ab3]/20 transition-colors"
      />
    </div>
  );
}
