import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AddTaskInline from "./task-inline"
import StatusSelect from "./status-select"
import TasksTable from "./tasks-table"
import MembersPanel from "./members-panel"


// 👇 params is a Promise in Next 15 server components
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params // ✅ await it

  const project = await prisma.project.findUnique({
    where: { id },
    include: { tasks: { orderBy: { createdAt: "desc" } } },
  })

  if (!project) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="break-all text-sm text-muted-foreground">ID: {project.id}</p>
        </div>
        <StatusSelect id={project.id} initial={project.status as any} />
      </div>
<MembersPanel projectId={project.id} />
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddTaskInline projectId={project.id} />
          <TasksTable
            initial={project.tasks.map((t: { id: string; title: string; done: boolean; due: Date | null }) => ({
              id: t.id,
              title: t.title,
              done: t.done,
              due: t.due ? t.due.toISOString() : null,
            }))}
          />
          <div className="flex justify-end">
            <Link href="/projects">
              <Button variant="outline">Back to Projects</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
