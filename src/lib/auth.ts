import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export type SessionUser = {
  id: string
  role: "DIRECTOR" | "MANAGER" | "CONSULTANT"
  email?: string | null
  name?: string | null
}

/** Returns the current user (or null) from NextAuth. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = (await getServerSession(authOptions as any)) as Session | null
  const u = session?.user as any
  if (!u?.id || !u?.role) return null
  return {
    id: String(u.id),
    role: u.role as SessionUser["role"],
    email: u.email ?? null,
    name: u.name ?? null,
  }
}

/** Throws 401 if not signed in. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 })
  }
  return user
}
