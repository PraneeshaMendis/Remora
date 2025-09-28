import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET /api/projects/:id/phases/:phaseId/tasks  -> list tasks for a phase
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  const { id: projectId, phaseId } = await params

  try {
    const tasks = await prisma.task.findMany({
      where: { projectId, phaseId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, done: true, due: true },
    })
    return NextResponse.json(tasks)
  } catch (e) {
    console.error("GET tasks error", e)
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 })
  }
}

// POST /api/projects/:id/phases/:phaseId/tasks  -> create a task in that phase
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const role = (session.user as any).role as "DIRECTOR" | "MANAGER" | "CONSULTANT"

  const { id: projectId, phaseId } = await params

  // Consultants must be members; directors/managers can always create
  if (role === "CONSULTANT") {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: session.user.id } },
      select: { projectId: true },
    })
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  let body: { title?: string; due?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const title = (body.title ?? "").trim()
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const due = body.due ? new Date(body.due) : null
  if (due && Number.isNaN(due.getTime())) {
    return NextResponse.json({ error: "Invalid due date" }, { status: 400 })
  }

  try {
    const task = await prisma.task.create({
      data: { title, due, projectId, phaseId },
      select: { id: true, title: true, done: true, due: true },
    })
    return NextResponse.json(task, { status: 201 })
  } catch (e) {
    console.error("POST task error", e)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
