import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role

  // Only DIRECTOR or MANAGER can create phases
  if (!role || (role !== "DIRECTOR" && role !== "MANAGER")) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { id: projectId } = await params
  const body = await req.json().catch(() => ({} as any))
  const name = (body?.name ?? "").trim()

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

// Compute next order for this project's phases
const currentCount = await prisma.phase.count({ where: { projectId } })

const phase = await prisma.phase.create({
  data: {
    name,
    projectId,
    order: currentCount, // required by your schema
  },
  select: { id: true, name: true, order: true },
})


  return NextResponse.json(phase, { status: 201 })
}
