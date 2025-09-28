"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type TaskDTO = {
  id: string
  title: string
  done: boolean
  due: string | null
  projectId: string
}

type LogDTO = {
  id: string
  date: string // ISO
  content: string
  attachment: string | null
}

export default function TaskScreen({
  projectId,
  taskId,
}: {
  projectId: string
  taskId: string
}) {
  const qc = useQueryClient()

  // ---- Queries ----
  const taskQ = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, { cache: "no-store" })
      if (!r.ok) throw new Error("Failed to load task")
      return (await r.json()) as TaskDTO
    },
  })

  const logsQ = useQuery({
    queryKey: ["taskLogs", taskId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/tasks/${taskId}/logs`, { cache: "no-store" })
      if (!r.ok) throw new Error("Failed to load logs")
      return (await r.json()) as LogDTO[]
    },
  })

  // ---- Mutations ----
  const addLog = useMutation({
    mutationFn: async (payload: { date: string; content: string; attachment?: string }) => {
      const r = await fetch(`/api/projects/${projectId}/tasks/${taskId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error("Failed to add log")
      return (await r.json()) as LogDTO
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["taskLogs", taskId] })
      toast.success("Log saved")
      setForm({
        date: new Date().toISOString().slice(0, 10),
        content: "",
        attachment: "",
      })
    },
    onError: (e: any) => toast.error(e.message || "Could not save log"),
  })

  const toggleDone = useMutation({
    mutationFn: async (next: boolean) => {
      const r = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      })
      if (!r.ok) throw new Error("Failed to update task")
      return (await r.json()) as TaskDTO
    },
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ["task", taskId] })
      const prev = qc.getQueryData<TaskDTO>(["task", taskId])
      qc.setQueryData<TaskDTO>(["task", taskId], (t) => (t ? { ...t, done: next } : t))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["task", taskId], ctx.prev)
      toast.error("Failed to update")
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Task updated")
    },
  })

  // ---- Form state ----
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    content: "",
    attachment: "",
  })

  // Convenience flags
  const loading = taskQ.isLoading || logsQ.isLoading

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading task…</div>
  }
  if (taskQ.isError) {
    return <div className="p-4 text-sm text-red-500">Failed to load task.</div>
  }

  const task = taskQ.data!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{task.title}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">Task ID: {task.id}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Due: <span className="font-medium">{task.due ? new Date(task.due).toLocaleDateString() : "—"}</span>
          </div>
        </div>
        <Link href={`/projects/${projectId}`} className="text-sm underline underline-offset-4">
          ← Back to Project
        </Link>
      </div>

      {/* Done toggle */}
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Mark task as done</div>
          <Button
            variant={task.done ? "secondary" : "default"}
            onClick={() => toggleDone.mutate(!task.done)}
            disabled={toggleDone.isPending}
          >
            {toggleDone.isPending ? "Updating…" : task.done ? "Done ✓" : "Mark Done"}
          </Button>
        </div>
      </div>

      {/* Add Daily Log */}
      <div className="rounded-lg border">
        <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">Add Daily Log</div>
        <form
          className="space-y-3 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            addLog.mutate({
              date: form.date,
              content: form.content,
              attachment: form.attachment || undefined,
            })
          }}
        >
          <div className="grid gap-1">
            <label htmlFor="date" className="text-sm font-medium">Work date</label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="notes" className="text-sm font-medium">Notes</label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="What did you do today?"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              required
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="attachment" className="text-sm font-medium">Attachment (URL)</label>
            <Input
              id="attachment"
              type="url"
              placeholder="https://…"
              value={form.attachment}
              onChange={(e) => setForm((f) => ({ ...f, attachment: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={addLog.isPending}>
              {addLog.isPending ? "Saving…" : "Save Log"}
            </Button>
          </div>
        </form>
      </div>

      {/* Log history */}
      <div className="rounded-lg border">
        <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
          Daily Logs ({logsQ.data?.length ?? 0})
        </div>
        <ul className="divide-y">
          {!logsQ.data?.length && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No logs yet.</li>
          )}
          {logsQ.data?.map((l) => (
            <li key={l.id} className="px-3 py-3">
              <div className="flex items-baseline justify-between gap-4">
                <div className="text-sm font-medium">{new Date(l.date).toLocaleDateString()}</div>
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm">{l.content}</div>
              {l.attachment && (
                <div className="mt-1">
                  <a
                    href={l.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline underline-offset-4"
                  >
                    View attachment
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
