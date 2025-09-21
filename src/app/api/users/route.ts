import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET /api/users  → list all users for the assign dropdown
export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(users)
}
