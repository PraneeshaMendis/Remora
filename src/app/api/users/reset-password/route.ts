// src/app/api/users/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { requireDirector } from "@/lib/authz"

const prisma = new PrismaClient()

// Directors only: generate a temporary password for a user and set it
export async function POST(req: NextRequest) {
  const gate = await requireDirector(req)
  if (!gate.ok) return gate.res

  try {
    const { userId } = (await req.json()) as { userId?: string }
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate a reasonably strong, short temp password (URL-safe)
    const tempPassword = crypto.randomBytes(6).toString("base64url") // ~8 chars, URL-safe
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    // Optional: send an email here if you want to notify the user.
    // You could reuse sendInviteEmail or create a dedicated sendResetEmail.

    return NextResponse.json({ ok: true, tempPassword })
  } catch (err) {
    console.error("POST /api/users/reset-password error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
