"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type TaskDTO = { id: string; title: string; done: boolean; due: string | null }

export default function PhaseTasks({
  projectId,
  phaseId,
}: {
  projectId: string
  phaseId: string
}) {
  const [tasks, setTasks] = useState<TaskDTO[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [due, setDue] = useState<string | "">("")

  async function load() {
    setErr(null)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/phases/${phaseId}/tasks`,
        { cache: "no-store" }
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(`GET ${res.status}: ${t}`)
      }
      const data: TaskDTO[] = await res.json()
      setTasks(data)
    } catch (e: any) {
      console.error("Load tasks failed", e)
      setErr(e?.message || "Failed to load tasks")
      setTasks([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, phaseId])

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/phases/${phaseId}/tasks` ,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            due: due ? new Date(due).toISOString() : null,
          }),
        }
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(`POST ${res.status}: ${t}`)
      }
      setTitle("")
      setDue("")
      await load()
    } catch (e: any) {
      console.error("Create task failed", e)
      setErr(e?.message || "Failed to create task")
    }
  }

  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
        Tasks
      </div>

      <form onSubmit={createTask} className="flex flex-wrap gap-2 p-3">
        <Input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-[220px]"
          required
        />
        <Input
          type="date"
          value={due || ""}
          onChange={(e) => setDue(e.target.value)}
        />
        <Button type="submit">Add</Button>
        {err && (
          <span className="text-sm text-red-500 ml-2">{err}</span>
        )}
      </form>

      <div className="p-3">
        {tasks === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Due: {t.due ? new Date(t.due).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div className="text-xs">{t.done ? "✅ Done" : "⬜️"}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
