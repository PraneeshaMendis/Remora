// src/lib/permissions.ts
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export type Role = "DIRECTOR" | "MANAGER" | "CONSULTANT"

export async function getAuthContext() {
  const session = await auth()
  if (!session?.user) return null
  const userId = String(session.user.id)
  const role = String(session.user.role) as Role
  return { userId, role }
}

export async function isProjectMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { projectId: true },
  })
  return Boolean(member)
}

export async function ensureProjectReadAccess(projectId: string) {
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false as const, status: 401, error: "Unauthorized" }

  if (ctx.role === "DIRECTOR" || ctx.role === "MANAGER") {
    return { ok: true as const, ctx }
  }
  if (await isProjectMember(projectId, ctx.userId)) {
    return { ok: true as const, ctx }
  }
  return { ok: false as const, status: 403, error: "Forbidden" }
}

export async function ensureProjectWriteAccess(projectId: string) {
  // Same rule as read access for now
  return ensureProjectReadAccess(projectId)
}
