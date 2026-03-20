"use server"

import { cookies } from "next/headers"

const ADMIN_COOKIE = "admin_session"

export async function adminLogin(secret: string) {
  const expected = process.env.ADMIN_SECRET
  if (!expected || secret !== expected) {
    return { error: "Invalid secret" }
  }
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
    path: "/admin",
    maxAge: 60 * 60 * 24,
  })
  return { success: true }
}

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_COOKIE)?.value === "1"
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
  return { success: true }
}

export async function requireAdmin() {
  const ok = await checkAdminAuth()
  if (!ok) throw new Error("Unauthorized")
}
