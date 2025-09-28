import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function requireDirector(req: NextRequest) {
  const token = await getToken({ req })
  const role = (token as any)?.role as string | undefined
  if (role === "DIRECTOR") return { ok: true as const, role }
  return {
    ok: false as const,
    res: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  }
}

export async function requireStaff(req: NextRequest) {
  const token = await getToken({ req })
  const role = (token as any)?.role as string | undefined
  // adjust as needed
  const allowed = ["DIRECTOR", "MANAGER", "LEAD", "CONSULTANT"]
  if (role && allowed.includes(role)) return { ok: true as const, role }
  return {
    ok: false as const,
    res: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  }
}
