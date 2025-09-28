// src/app/api/projects/[id]/tasks/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

type Ctx = { params: Promise<{ id: string }> }
type SessionUser = { id: string; role: "DIRECTOR" | "MANAGER" | "CONSULTANT" }
type SessionLike = { user?: SessionUser } | null

// GET: list tasks for a project
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params // ✅ await params
  const session = (await getServerSession(authOptions as any)) as SessionLike
  const role = session?.user?.role
  const userId = session?.user?.id

  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Consultants must be members of the project
  if (role === "CONSULTANT") {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: userId! } },
      select: { projectId: true },
    })
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const tasks = await prisma.task.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, done: true, due: true },
  })

  return NextResponse.json(tasks)
}

// POST: create task (Directors/Managers only)
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params // ✅ await params
  const session = (await getServerSession(authOptions as any)) as SessionLike
  const role = session?.user?.role

  if (!role || !["DIRECTOR", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 })
  }

  const task = await prisma.task.create({
    data: {
      projectId: id,
      title: String(body.title),
      due: body.due ? new Date(body.due) : null,
    },
    select: { id: true, title: true, done: true, due: true },
  })

  return NextResponse.json(task, { status: 201 })
}
