import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import Navbar from "@/components/marketing/navbar"
import Hero from "@/components/marketing/hero"
import Stats from "@/components/marketing/stats"
import Specialties from "@/components/marketing/specialties"
import HowItWorks from "@/components/marketing/how-it-works"
import Features from "@/components/marketing/features"
import ClinicCTA from "@/components/marketing/clinic-cta"
import Footer from "@/components/marketing/footer"

// Logged-in users go to their dashboard; guests see the landing page
export default async function HomePage() {
  const session = await getSession()

  if (session) {
    if (session.role === "doctor") {
      redirect("/doctor")
    } else {
      redirect("/receptionist/patients")
    }
  }

  return (
    <div className="bg-white dark:bg-background public-layout">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Specialties />
        <HowItWorks />
        <Features />
        <ClinicCTA />
      </main>
      <Footer />
    </div>
  )
}
