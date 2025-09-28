import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const phases = await prisma.phase.findMany({
    where: { projectId: id },
    orderBy: { order: "asc" },
    select: { id: true, name: true, order: true },
  })
  return NextResponse.json(phases)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const session = (await getServerSession(authOptions as any)) as any
  const role = session?.user?.role as "DIRECTOR" | "MANAGER" | "CONSULTANT" | undefined

  // only directors and managers can create phases
  if (role !== "DIRECTOR" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { name } = (await req.json().catch(() => ({}))) as { name?: string }
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const order = await prisma.phase.count({ where: { projectId } })

  const phase = await prisma.phase.create({
    data: { name, projectId, order },
    select: { id: true, name: true, order: true },
  })

  return NextResponse.json(phase, { status: 201 })
}
