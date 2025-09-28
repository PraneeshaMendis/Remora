import { NextResponse } from "next/server"
import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { name, email, role } = (await req.json()) as {
      name?: string
      email?: string
      role?: Role
    }

    // Basic validation (keep it simple for now)
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 })
    }
    if (!role || !["DIRECTOR", "MANAGER", "LEAD", "CONSULTANT", "CLIENT"].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    // Create a temporary password (e.g., invite flow later)
    const tempPassword = crypto.randomBytes(8).toString("hex") // 16 chars
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        role: role as Role,
        passwordHash,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    // NOTE: For now we just return the user; later we’ll email the invite link.
    return NextResponse.json({ user }, { status: 201 })
  } catch (err: any) {
    // Handle unique constraint (email)
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 })
    }
    console.error("POST /api/users error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }

}
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    return NextResponse.json({ users })
  } catch (err) {
    console.error("GET /api/users error:", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}

