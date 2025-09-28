// src/app/(dashboard)/projects/[id]/phase-list.tsx
"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type Task = {
  id: string
  title: string
  done: boolean
  due: string | null
}

type Phase = {
  id: string
  name: string
}

export default function PhaseList({
  projectId,
  phases,
}: {
  projectId: string
  phases: Phase[]
}) {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [creating, setCreating] = useState<Record<string, boolean>>({})
  const [items, setItems] = useState<Record<string, Task[]>>({})
  const [title, setTitle] = useState<Record<string, string>>({})
  const [due, setDue] = useState<Record<string, string>>({})
  const [error, setError] = useState<Record<string, string | null>>({})

  async function loadTasks(phaseId: string) {
    setLoading((s) => ({ ...s, [phaseId]: true }))
    setError((e) => ({ ...e, [phaseId]: null }))
    try {
      const res = await fetch(
        `/api/projects/${projectId}/phases/${phaseId}/tasks`,
        { cache: "no-store" }
      )
      if (!res.ok) throw new Error(`GET tasks ${res.status}`)
      const data = (await res.json()) as Task[]
      setItems((m) => ({ ...m, [phaseId]: data }))
    } catch (e: any) {
      setError((er) => ({ ...er, [phaseId]: e.message || "Failed to load tasks" }))
    } finally {
      setLoading((s) => ({ ...s, [phaseId]: false }))
    }
  }

  async function createTask(phaseId: string) {
    setError((e) => ({ ...e, [phaseId]: null }))
    const rawTitle = (title[phaseId] || "").trim()
    if (!rawTitle) {
      setError((e) => ({ ...e, [phaseId]: "Title is required" }))
      return
    }

    setCreating((c) => ({ ...c, [phaseId]: true }))
    try {
      const body = {
        title: rawTitle,
        due: due[phaseId] ? new Date(due[phaseId]).toISOString() : null,
      }

      const res = await fetch(
        `/api/projects/${projectId}/phases/${phaseId}/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      if (!res.ok) throw new Error(`POST task ${res.status}`)

      const created = (await res.json()) as Task
      setItems((m) => ({ ...m, [phaseId]: [created, ...(m[phaseId] || [])] }))
      setTitle((t) => ({ ...t, [phaseId]: "" }))
      setDue((d) => ({ ...d, [phaseId]: "" }))
    } catch (e: any) {
      setError((er) => ({ ...er, [phaseId]: e.message || "Failed to create task" }))
    } finally {
      setCreating((c) => ({ ...c, [phaseId]: false }))
    }
  }

  useEffect(() => {
    phases.forEach((p) => {
      if (!items[p.id]) loadTasks(p.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, phases.map((p) => p.id).join(",")])

  return (
    <div className="space-y-6">
      {phases.map((ph) => (
        <div key={ph.id} className="rounded-lg border bg-card">
          {/* Phase header */}
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
            <div className="font-medium">{ph.name}</div>
            <button
              onClick={() => loadTasks(ph.id)}
              className="text-xs underline underline-offset-4"
              disabled={loading[ph.id]}
            >
              {loading[ph.id] ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {/* Add-task row */}
          <div className="flex flex-wrap items-end gap-3 p-4">
            <div className="grow min-w-[220px]">
              <label className="block text-xs font-medium mb-1">Task title</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="e.g. Gather requirements"
                value={title[ph.id] || ""}
                onChange={(e) =>
                  setTitle((t) => ({ ...t, [ph.id]: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Due (optional)</label>
              <input
                type="date"
                className="rounded-md border px-3 py-2 text-sm"
                value={due[ph.id] || ""}
                onChange={(e) =>
                  setDue((d) => ({ ...d, [ph.id]: e.target.value }))
                }
              />
            </div>
            <button
              onClick={() => createTask(ph.id)}
              disabled={creating[ph.id]}
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted/60 disabled:opacity-60"
            >
              {creating[ph.id] ? "Adding…" : "Add Task"}
            </button>
          </div>

          {error[ph.id] && (
            <div className="px-4 pb-2 text-xs text-red-600">{error[ph.id]}</div>
          )}

          {/* Tasks list */}
          <div className="px-4 pb-4">
            {loading[ph.id] && (
              <div className="text-sm text-muted-foreground">Loading…</div>
            )}

            {!loading[ph.id] && (items[ph.id]?.length ?? 0) === 0 && (
              <div className="text-sm text-muted-foreground">No tasks yet.</div>
            )}

            {!loading[ph.id] && (items[ph.id]?.length ?? 0) > 0 && (
              <ul className="space-y-2">
                {(items[ph.id] || []).map((t) => (
                  <li
                    key={t.id}
                    className="rounded-md border px-3 py-2 hover:bg-muted/40 transition-colors"
                  >
                    <Link
                      href={`/projects/${projectId}/tasks/${t.id}`}
                      className="block"
                    >
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.due
                          ? `Due: ${new Date(t.due).toLocaleDateString()}`
                          : "No due date"}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}

      {phases.length === 0 && (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          No phases yet.
        </div>
      )}
    </div>
  )
}
