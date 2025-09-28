import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

type SessionUser = { id?: string; role?: "DIRECTOR" | "MANAGER" | "CONSULTANT" }
type SessionLike = { user?: SessionUser } | null

export async function GET() {
  // Explicitly cast so TS knows we have a `user` field
  const session = (await getServerSession(authOptions as any)) as SessionLike

  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const role = session.user.role

  // 1) Find review logs
  const logs = await prisma.taskLog.findMany({
    where: { content: { startsWith: "[REVIEW]" } },
    orderBy: { date: "desc" },
    select: { id: true, taskId: true, userId: true, date: true, content: true, attachment: true },
    take: 200,
  })

  // 2) Enrich with task & project
  const withMeta = await Promise.all(
    logs.map(async (l) => {
      const task = await prisma.task.findUnique({
        where: { id: l.taskId },
        select: { id: true, title: true, projectId: true },
      })
      const project =
        task?.projectId
          ? await prisma.project.findUnique({
              where: { id: task.projectId },
              select: { id: true, name: true },
            })
          : null

      return {
        id: l.id,
        date: l.date.toISOString(),
        content: l.content,
        attachment: l.attachment,
        taskId: task?.id ?? l.taskId,
        taskTitle: task?.title ?? "Task",
        projectId: project?.id ?? task?.projectId ?? null,
        projectName: project?.name ?? "(Unknown project)",
        requestedBy: l.userId,
      }
    })
  )

  // 3) Consultants only see their project items
  if (role === "CONSULTANT") {
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    })
    const allowed = new Set(memberships.map((m) => m.projectId))
    return NextResponse.json(withMeta.filter((x) => x.projectId && allowed.has(x.projectId!)))
  }

  // Directors / Managers see all
  return NextResponse.json(withMeta)
}
