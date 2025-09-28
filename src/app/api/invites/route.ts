// src/app/api/invites/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, Role } from "@prisma/client"
import crypto from "crypto"
import { sendInviteEmail } from "@/lib/mail"
import { requireDirector } from "@/lib/authz"

const prisma = new PrismaClient()

// Create an invite (Directors only)
export async function POST(req: NextRequest) {
  const gate = await requireDirector(req)
  if (!gate.ok) return gate.res

  try {
    const { email, role, expiresInHours } = (await req.json()) as {
      email?: string
      role?: Role
      expiresInHours?: number
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

    const token = crypto.randomBytes(32).toString("hex")
    const ttlHrs = Math.max(1, Math.min(expiresInHours ?? 24, 168)) // 1h–7d
    const expiresAt = new Date(Date.now() + ttlHrs * 3600 * 1000)

    const invite = await prisma.invite.create({
      data: {
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    const base = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const link = `${base}/invite/accept?token=${invite.token}`

    // Try to send the email; do not fail if SMTP isn't configured
    let emailStatus: "sent" | "skipped" | "failed" = "skipped"
    try {
      const res = await sendInviteEmail(invite.email, link, String(invite.role))
      emailStatus = (res as any)?.skipped ? "skipped" : "sent"
    } catch (e) {
      console.error("Invite email failed:", e)
      emailStatus = "failed"
    }

    return NextResponse.json({ invite, link, emailStatus }, { status: 201 })
  } catch (err) {
    console.error("POST /api/invites error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

// Validate an invite token (public — used by /invite/accept)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    const invite = await prisma.invite.findUnique({
      where: { token },
      select: { id: true, email: true, role: true, expiresAt: true, usedAt: true },
    })

    if (!invite) {
      return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 })
    }
    if (invite.usedAt) {
      return NextResponse.json({ valid: false, reason: "used" }, { status: 410 })
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ valid: false, reason: "expired" }, { status: 410 })
    }

    return NextResponse.json({ valid: true, invite })
  } catch (err) {
    console.error("GET /api/invites error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
