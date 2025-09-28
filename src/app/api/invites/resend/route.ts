// src/app/api/invites/resend/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, Role } from "@prisma/client"
import crypto from "crypto"
import { sendInviteEmail } from "@/lib/mail"
import { requireDirector } from "@/lib/authz"

const prisma = new PrismaClient()

// Directors only: resend (or create) an invite for a given email/role
export async function POST(req: NextRequest) {
  const gate = await requireDirector(req)
  if (!gate.ok) return gate.res

  try {
    const { email, role } = (await req.json()) as {
      email?: string
      role?: Role
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 })
    }
    if (
      !role ||
      !["DIRECTOR", "MANAGER", "LEAD", "CONSULTANT", "CLIENT"].includes(role)
    ) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()
    const now = Date.now()

    // Try to find an existing active invite (not used, not expired)
    let invite = await prisma.invite.findFirst({
      where: {
        email: normalizedEmail,
        usedAt: null,
        expiresAt: { gt: new Date(now) },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, token: true, expiresAt: true, createdAt: true },
    })

    // If none, create a new one with a fresh token (24h default)
    if (!invite) {
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(now + 24 * 3600 * 1000)
      invite = await prisma.invite.create({
        data: {
          email: normalizedEmail,
          role,
          token,
          expiresAt,
        },
        select: { id: true, email: true, role: true, token: true, expiresAt: true, createdAt: true },
      })
    }

    // Build link and send email
    const base = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const link = `${base}/invite/accept?token=${invite.token}`

    let emailStatus: "sent" | "skipped" | "failed" = "skipped"
    try {
      const res = await sendInviteEmail(invite.email, link, String(invite.role))
      emailStatus = (res as any)?.skipped ? "skipped" : "sent"
    } catch (e) {
      console.error("Resend invite email failed:", e)
      emailStatus = "failed"
    }

    return NextResponse.json({ invite, link, emailStatus })
  } catch (err) {
    console.error("POST /api/invites/resend error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
