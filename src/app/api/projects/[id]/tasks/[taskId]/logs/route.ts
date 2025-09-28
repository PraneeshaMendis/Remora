import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireSessionUser } from "@/lib/auth"

// GET /api/projects/:id/tasks/:taskId/logs
export async function GET({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>
}) {
  const { id: projectId, taskId } = await params

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true },
  })
  if (!task || task.projectId !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const logs = await prisma.taskLog.findMany({
    where: { taskId },
    orderBy: { date: "desc" },
    select: { id: true, date: true, content: true, attachment: true },
  })
  return NextResponse.json(logs)
}

// POST /api/projects/:id/tasks/:taskId/logs
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const user = await requireSessionUser()
  const { id: projectId, taskId } = await params

  // Accept form submissions and JSON
  const contentType = req.headers.get("content-type") || ""
  let dateStr = "", notes = "", attachment: string | null = null

  if (contentType.includes("application/json")) {
    const body = await req.json()
    dateStr = body.date
    notes = body.notes
    attachment = body.attachment ?? null
  } else {
    const form = await req.formData()
    dateStr = String(form.get("date") || "")
    notes = String(form.get("notes") || "")
    const att = form.get("attachment")
    attachment = att ? String(att) : null
  }

  if (!dateStr || !notes) {
    return NextResponse.json({ error: "Missing date or notes" }, { status: 400 })
  }

  // Ensure the task belongs to the project
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true },
  })
  if (!task || task.projectId !== projectId) {
    return NextResponse.json({ error: "Task not found under project" }, { status: 404 })
  }

  const created = await prisma.taskLog.create({
    data: {
      taskId,
      userId: user.id,
      date: new Date(dateStr),
      content: notes,
      attachment,
    },
    select: { id: true, date: true, content: true, attachment: true },
  })

  return NextResponse.json(created, { status: 201 })
}
