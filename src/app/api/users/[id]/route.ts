// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getToken } from "next-auth/jwt"

const prisma = new PrismaClient()

// DELETE /api/users/:id  (Directors only; cannot delete yourself)
export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const token = await getToken({ req })
    const role = (token as any)?.role as string | undefined
    const requesterEmail = (token as any)?.email as string | undefined

    if (role !== "DIRECTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = ctx.params?.id
    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 })
    }

    // Prevent self-delete
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    })
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (requesterEmail && target.email.toLowerCase() === requesterEmail.toLowerCase()) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 })
    }

    // Delete
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE /api/users/[id] error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
