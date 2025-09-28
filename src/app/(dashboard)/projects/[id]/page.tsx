import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import MembersPanel from "./members-panel"
import PhasesPanel from "./phases-panel"
import PhaseList from "./phase-list"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next 15 dynamic params are a Promise
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      phases: {
        orderBy: { order: "asc" },          // ensure stable order
        select: { id: true, name: true, order: true },
      },
    },
  })

  if (!project) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground break-all">ID: {project.id}</p>
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-medium">{project.status}</span>
          </p>
        </div>
        <Link href="/projects" className="text-sm underline underline-offset-4">
          ← Back to Projects
        </Link>
      </div>

      {project.description ? (
        <p className="text-sm">{project.description}</p>
      ) : (
        <p className="text-sm text-muted-foreground">No description provided.</p>
      )}

      {/* Members */}
      <MembersPanel projectId={project.id} />

      {/* Phases: create/reorder/etc. (expects order) */}
      <PhasesPanel
        projectId={project.id}
        initial={project.phases.map((p) => ({ id: p.id, name: p.name, order: p.order }))}
      />

      {/* Tasks inside each phase (needs only id + name) */}
      <PhaseList
        projectId={project.id}
        phases={project.phases.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  )
}
