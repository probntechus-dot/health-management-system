"use server"

import { cookies, headers } from "next/headers"
import { createHmac, timingSafeEqual } from "crypto"
import { checkRateLimit } from "@/lib/rate-limit"

const ADMIN_COOKIE = "admin_session"
const IS_PRODUCTION = process.env.NODE_ENV === "production"

/** Create an HMAC signature so the cookie value cannot be forged. */
function signToken(payload: string): string {
  const secret = process.env.ADMIN_SECRET ?? ""
  return createHmac("sha256", secret).update(payload).digest("hex")
}

function verifyToken(payload: string, signature: string): boolean {
  const expected = signToken(payload)
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function adminLogin(secret: string) {
  // Rate limit: 5 attempts per 5 minutes per IP
  const headersList = await headers()
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  const rl = checkRateLimit(`adminLogin:${ip}`, 5, 300_000)
  if (!rl.allowed) {
    const waitSec = Math.ceil(rl.retryAfterMs / 1000)
    return { error: `Too many attempts. Please wait ${waitSec} seconds.` }
  }

  const expected = process.env.ADMIN_SECRET
  if (!expected || secret !== expected) {
    return { error: "Invalid secret" }
  }

  // Create a signed cookie value: payload.signature
  const payload = `admin:${Date.now()}`
  const signature = signToken(payload)
  const tokenValue = `${payload}.${signature}`

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, tokenValue, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24,
  })
  return { success: true }
}

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(ADMIN_COOKIE)?.value
  if (!raw) return false
  const dotIdx = raw.lastIndexOf(".")
  if (dotIdx === -1) return false
  const payload = raw.slice(0, dotIdx)
  const signature = raw.slice(dotIdx + 1)
  if (!payload.startsWith("admin:")) return false
  return verifyToken(payload, signature)
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
