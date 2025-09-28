"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Phase = { id: string; name: string; order: number }
type Task = { id: string; title: string; done: boolean; due: string | null; phaseId: string | null }

export default function TasksByPhasePanel({ projectId }: { projectId: string }) {
  const [phases, setPhases] = useState<Phase[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // form
  const [title, setTitle] = useState("")
  const [due, setDue] = useState<string>("")
  const [phaseId, setPhaseId] = useState<string>("")
  const [creating, setCreating] = useState(false)

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [pRes, tRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/phases`, { cache: "no-store" }),
        fetch(`/api/projects/${projectId}/tasks`, { cache: "no-store" }),
      ])
      if (!pRes.ok) throw new Error("Failed to load phases")
      if (!tRes.ok) throw new Error("Failed to load tasks")
      const p = (await pRes.json()) as Phase[]
      const t = (await tRes.json()) as Task[]
      setPhases(p.sort((a, b) => a.order - b.order))
      setTasks(t)
      // default phase in form
      if (!phaseId && p.length) setPhaseId(p[0].id)
    } catch (e: any) {
      setError(e.message ?? "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const ph of phases) map.set(ph.id, [])
    for (const t of tasks) {
      const k = t.phaseId ?? "__unassigned__"
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(t)
    }
    return map
  }, [phases, tasks])

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !phaseId) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          phaseId,
          due: due ? new Date(due).toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error("Failed to create task")
      setTitle("")
      setDue("")
      await loadAll()
    } catch (e: any) {
      setError(e.message ?? "Failed to create task")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by Phase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create form */}
        <form onSubmit={createTask} className="grid gap-2 sm:grid-cols-4">
          <Input
            className="sm:col-span-2"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        <Input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            placeholder="Due date"
          />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={phaseId}
            onChange={(e) => setPhaseId(e.target.value)}
          >
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.order}. {p.name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={creating || !title.trim() || !phaseId}>
            {creating ? "Adding…" : "Add Task"}
          </Button>
        </form>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Lists */}
        <div className="space-y-4">
          {phases.map((p) => {
            const list = grouped.get(p.id) ?? []
            return (
              <div key={p.id} className="rounded-lg border">
                <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
                  {p.order}. {p.name} <span className="text-muted-foreground">({list.length})</span>
                </div>
                <ul className="divide-y">
                  {list.length === 0 && (
                    <li className="px-3 py-3 text-sm text-muted-foreground">No tasks yet.</li>
                  )}
                  {list.map((t) => (
                    <li key={t.id} className="px-3 py-3 text-sm">
                      <Link
                        href={`/projects/${projectId}/tasks/${t.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {t.title}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t.due ? `Due ${new Date(t.due).toLocaleDateString()}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}

          {/* Unassigned bucket, if any */}
          {grouped.get("__unassigned__") && (grouped.get("__unassigned__")!.length > 0) && (
            <div className="rounded-lg border">
              <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
                Unassigned <span className="text-muted-foreground">({grouped.get("__unassigned__")!.length})</span>
              </div>
              <ul className="divide-y">
                {grouped.get("__unassigned__")!.map((t) => (
                  <li key={t.id} className="px-3 py-3 text-sm">
                    <Link href={`/projects/${projectId}/tasks/${t.id}`} className="underline-offset-4 hover:underline">
                      {t.title}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t.due ? `Due ${new Date(t.due).toLocaleDateString()}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
