import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function canRead(user: any, projectId: string) {
  const role = user?.role as string | undefined
  if (role === "DIRECTOR" || role === "MANAGER") return true
  if (role === "CONSULTANT") {
    if (!user?.id) return false
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
      select: { projectId: true },
    })
    return Boolean(member)
  }
  return false
}

async function canWrite(user: any, projectId: string) {
  const role = user?.role as string | undefined
  if (role === "DIRECTOR" || role === "MANAGER") return true
  if (role === "CONSULTANT") {
    if (!user?.id) return false
    // consultants can write only if assigned to the project
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
      select: { projectId: true },
    })
    return Boolean(member)
  }
  return false
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new Response("Unauthorized", { status: 401 })

  const { id: projectId, taskId } = await params

  if (!(await canRead(session.user, projectId))) {
    return new Response("Forbidden", { status: 403 })
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, done: true, due: true, projectId: true },
  })
  if (!task || task.projectId !== projectId) {
    return new Response("Not found", { status: 404 })
  }

  return Response.json({
    ...task,
    due: task.due ? task.due.toISOString() : null,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new Response("Unauthorized", { status: 401 })

  const { id: projectId, taskId } = await params

  if (!(await canWrite(session.user, projectId))) {
    return new Response("Forbidden", { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { done, title, due } = body as {
    done?: boolean
    title?: string
    due?: string | null
  }

  // Ensure the task belongs to this project
  const exists = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  })
  if (!exists || exists.projectId !== projectId) {
    return new Response("Not found", { status: 404 })
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(typeof done === "boolean" ? { done } : {}),
      ...(typeof title === "string" ? { title } : {}),
      ...(due === null ? { due: null } : typeof due === "string" ? { due: new Date(due) } : {}),
    },
    select: { id: true, title: true, done: true, due: true, projectId: true },
  })

  return Response.json({
    ...updated,
    due: updated.due ? updated.due.toISOString() : null,
  })
}
