import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { token, name, password } = (await req.json()) as {
      token?: string
      name?: string
      password?: string
    }

    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
    }

    const invite = await prisma.invite.findUnique({
      where: { token },
      select: { id: true, email: true, role: true, expiresAt: true, usedAt: true, userId: true },
    })
    if (!invite) return NextResponse.json({ error: "Invalid token." }, { status: 404 })
    if (invite.usedAt) return NextResponse.json({ error: "Invite already used." }, { status: 410 })
    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Invite expired." }, { status: 410 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // If a user already exists for this email, update it; otherwise create.
    const existing = await prisma.user.findUnique({
      where: { email: invite.email.toLowerCase() },
      select: { id: true, email: true, name: true, role: true },
    })

    let userId: string
    if (existing) {
      const updated = await prisma.user.update({
        where: { email: invite.email.toLowerCase() },
        data: {
          // If they supplied a name, refresh; else keep existing
          name: name?.trim().length ? name.trim() : existing.name,
          // Align role to the invite (you can relax this if you don’t want role changes)
          role: invite.role,
          passwordHash,
        },
        select: { id: true },
      })
      userId = updated.id
    } else {
      const created = await prisma.user.create({
        data: {
          name: name?.trim().length ? name.trim() : invite.email.split("@")[0],
          email: invite.email.toLowerCase(),
          role: invite.role,
          passwordHash,
        },
        select: { id: true },
      })
      userId = created.id
    }

    // Mark invite as used
    await prisma.invite.update({
      where: { token },
      data: { usedAt: new Date(), userId },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("POST /api/invites/accept error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
