import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

export const dynamic = "force-dynamic"

// schema for adding a member
const addSchema = z.object({
  userId: z.string().min(1),
  role: z.string().optional(),
})

// GET all members of a project
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: { user: true },
  })
  return NextResponse.json(members)
}

// POST assign a user to project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId: id,
      userId: parsed.data.userId,
      role: parsed.data.role ?? "Member",
    },
    include: { user: true },
  })

  return NextResponse.json(member, { status: 201 })
}

// DELETE unassign a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId: id, userId } },
  })

  return new NextResponse(null, { status: 204 })
}
