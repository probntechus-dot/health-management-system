import { getSession } from "@/actions/auth"
import { redirect } from "next/navigation"

export default async function Page() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.role === "doctor") {
    redirect("/doctor")
  }

  redirect("/receptionist/patients")
}
