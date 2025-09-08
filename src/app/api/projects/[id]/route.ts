import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

export const dynamic = "force-dynamic"

const patchSchema = z.object({
  status: z.string().min(1),
})

// PATCH /api/projects/:id  → update status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error("PATCH /api/projects/[id] failed:", err)
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    )
  }
}
