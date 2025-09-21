"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjects, useCreateProject } from "@/lib/api"

const STATUSES = ["Active", "Planning", "OnHold", "Done"] as const

function statusVariant(
  s: (typeof STATUSES)[number]
): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "Active":
      return "default"
    case "Planning":
      return "secondary"
    case "OnHold":
      return "outline"
    case "Done":
      return "destructive" // change to "outline" if you prefer subtle
  }
}

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects()
  const create = useCreateProject()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{
    name: string
    description: string
    status: (typeof STATUSES)[number]
  }>({ name: "", description: "", status: "Active" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await create.mutateAsync(form)
    setForm({ name: "", description: "", status: "Active" })
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Button onClick={() => setOpen((o) => !o)}>
          {open ? "Cancel" : "New Project"}
        </Button>
      </div>

      {/* Create form */}
      {open && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as (typeof STATUSES)[number] })
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating..." : "Create"}
          </Button>
        </form>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-6">
              <div className="mb-4 flex items-start justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-500">Failed to load projects</p>}

      {/* List */}
      {!isLoading && projects && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle>{project.name}</CardTitle>
                  <Badge variant={statusVariant(project.status as any)} className="shrink-0">
                    {project.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {project.description ?? "—"}
                  </p>

                  {/* NEW: counts */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Members: {project._count?.members ?? 0} • Tasks: {project._count?.tasks ?? 0}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {projects.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No projects yet — click <span className="font-medium">New Project</span>.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
