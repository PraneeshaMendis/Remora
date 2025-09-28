import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { z } from "zod"

const CreateAttachmentSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  url: z.string().url("Valid URL required"),
})

/**
 * GET /api/projects/:projectId/tasks/:taskId/attachments
 * Directors/Managers: see all
 * Consultants: must be member of the project
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  const session = await getServerSession(authOptions)
  const role = (session as any)?.user?.role as string | undefined
  const userId = (session as any)?.user?.id as string | undefined
  if (!role || !userId) return new NextResponse("Unauthorized", { status: 401 })

  const { id: projectId, taskId } = params

  // Ensure task belongs to project
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true },
  })
  if (!task || task.projectId !== projectId) return new NextResponse("Not found", { status: 404 })

  // Consultants must be members
  if (role === "CONSULTANT") {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { projectId: true },
    })
    if (!membership) return new NextResponse("Forbidden", { status: 403 })
  }

  const items = await prisma.attachment.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      url: true,
      uploadedBy: true,
      uploader: { select: { name: true, email: true } },
      createdAt: true,
    },
  })

  const data = items.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }))

  return NextResponse.json(data)
}

/**
 * POST /api/projects/:projectId/tasks/:taskId/attachments
 * Body: { filename: string, url: string }
 * Directors/Managers/Consultants: can add (consultants must be members)
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  const session = await getServerSession(authOptions)
  const role = (session as any)?.user?.role as string | undefined
  const userId = (session as any)?.user?.id as string | undefined
  if (!role || !userId) return new NextResponse("Unauthorized", { status: 401 })

  const { id: projectId, taskId } = params

  // Ensure task belongs to project
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true },
  })
  if (!task || task.projectId !== projectId) return new NextResponse("Not found", { status: 404 })

  // Consultants must be members
  if (role === "CONSULTANT") {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { projectId: true },
    })
    if (!membership) return new NextResponse("Forbidden", { status: 403 })
  }

  const json = await req.json().catch(() => ({}))
  const parsed = CreateAttachmentSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { filename, url } = parsed.data

  const created = await prisma.attachment.create({
    data: {
      taskId,
      uploadedBy: userId,
      filename,
      url,
    },
    select: {
      id: true,
      filename: true,
      url: true,
      uploadedBy: true,
      createdAt: true,
    },
  })

  return NextResponse.json(
    { ...created, createdAt: created.createdAt.toISOString() },
    { status: 201 }
  )
}

/**
 * DELETE /api/projects/:projectId/tasks/:taskId/attachments?id=ATTACHMENT_ID
 * Directors/Managers: can delete any
 * Consultants: can delete only attachments they uploaded (and must be members)
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  const session = await getServerSession(authOptions)
  const role = (session as any)?.user?.role as string | undefined
  const userId = (session as any)?.user?.id as string | undefined
  if (!role || !userId) return new NextResponse("Unauthorized", { status: 401 })

  const { id: projectId, taskId } = params
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id") || ""

  if (!id) return new NextResponse("Missing id", { status: 400 })

  // Ensure task belongs to project
  const att = await prisma.attachment.findUnique({
    where: { id },
    select: { id: true, taskId: true, uploadedBy: true, task: { select: { projectId: true } } },
  })
  if (!att || att.task.projectId !== projectId || att.taskId !== taskId) {
    return new NextResponse("Not found", { status: 404 })
  }

  // Consultants: must be members and only delete their own
  if (role === "CONSULTANT") {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { projectId: true },
    })
    if (!membership) return new NextResponse("Forbidden", { status: 403 })
    if (att.uploadedBy !== userId) return new NextResponse("Forbidden", { status: 403 })
  }

  await prisma.attachment.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
