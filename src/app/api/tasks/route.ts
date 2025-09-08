import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

export const dynamic = "force-dynamic"

/* ---------- Schemas ---------- */

// create task
const createSchema = z.object({
  title: z.string().min(1),
  projectId: z.string().optional().nullable(), // accept any string id
  due: z.string().datetime().optional().nullable(),
})

// update task (id is any non-empty string; fields optional)
const patchSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  done: z.boolean().optional(),
  projectId: z.string().optional().nullable(),
  due: z.string().datetime().optional().nullable(),
})

// delete task
const deleteSchema = z.object({
  id: z.string().min(1),
})

/* ---------- Routes ---------- */

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, name: true } } },
  })
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { title, projectId, due } = parsed.data
    const task = await prisma.task.create({
      data: { title, projectId: projectId ?? null, due: due ? new Date(due) : null },
    })
    return NextResponse.json(task, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/tasks failed:", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { id, title, done, projectId, due } = parsed.data
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(done !== undefined ? { done } : {}),
        ...(projectId !== undefined ? { projectId } : {}),
        ...(due !== undefined ? { due: due ? new Date(due) : null } : {}),
      },
    })
    return NextResponse.json(task)
  } catch (err: any) {
    console.error("PATCH /api/tasks failed:", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const parsed = deleteSchema.safeParse({ id: id ?? "" })
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    await prisma.task.delete({ where: { id: parsed.data.id } })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error("DELETE /api/tasks failed:", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
