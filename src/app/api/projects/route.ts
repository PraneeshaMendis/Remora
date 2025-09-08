import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

export const dynamic = "force-dynamic"

const createSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["Active", "Planning", "OnHold", "Done"]).default("Planning"),
  description: z.string().optional(),
})

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  })
  return Response.json(projects)
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}))
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { "content-type": "application/json" },
    })
  }

  const p = await prisma.project.create({ data: parsed.data })
  return Response.json(p, { status: 201 })
}
