import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const { searchParams } = new URL(req.url)
  const phaseId = searchParams.get("phaseId") || undefined

  const tasks = await prisma.task.findMany({
    where: { projectId, ...(phaseId ? { phaseId } : {}) },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, done: true, due: true, phaseId: true },
  })

  return NextResponse.json(
    tasks.map((t) => ({
      ...t,
      due: t.due ? t.due.toISOString() : null,
    }))
  )
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const userId = session?.user?.id
  if (!role || !userId) return new NextResponse("Unauthorized", { status: 401 })

  // Directors/Managers can create tasks for any project.
  // Consultants may create tasks only if they are members (optional—adjust if you want to forbid).
  const { id: projectId } = await params
  const { title, due, phaseId } = await req.json()

  if (!title || typeof title !== "string" || !title.trim()) {
    return new NextResponse("Title is required", { status: 400 })
  }
  if (!phaseId || typeof phaseId !== "string") {
    return new NextResponse("phaseId is required", { status: 400 })
  }

  if (role === "CONSULTANT") {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { userId: true },
    })
    if (!membership) return new NextResponse("Forbidden", { status: 403 })
  }

  // ensure phase belongs to project
  const phase = await prisma.phase.findFirst({
    where: { id: phaseId, projectId },
    select: { id: true },
  })
  if (!phase) return new NextResponse("Invalid phase", { status: 400 })

  const created = await prisma.task.create({
    data: {
      title: title.trim(),
      projectId,
      phaseId,
      due: due ? new Date(due) : null,
    },
    select: { id: true, title: true, done: true, due: true, phaseId: true },
  })

  return NextResponse.json(
    { ...created, due: created.due ? created.due.toISOString() : null },
    { status: 201 }
  )
}
