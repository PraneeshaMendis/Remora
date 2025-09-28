"use client"

import Link from "next/link"
import { useState, useTransition, useOptimistic } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

type Task = {
  id: string
  title: string
  done: boolean
  due: string | null
}

type Log = {
  id: string
  date: string   // ISO
  content: string
  attachment: string | null
}

export default function TaskDetails({
  projectId,
  task,
  initialLogs,
}: {
  projectId: string
  task: Task
  initialLogs: Log[]
}) {
  const [t, setT] = useState<Task>(task)
  const [logs, setLogs] = useState<Log[]>(initialLogs)
  const [optimistic, setOptimistic] = useOptimistic(logs)
  const [isPending, startTransition] = useTransition()

  // form state
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState("")
  const [attachment, setAttachment] = useState("")

  async function toggleDone(next: boolean) {
    // optimistic
    const prev = t.done
    setT(s => ({ ...s, done: next }))

    const res = await fetch(`/api/projects/${projectId}/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    })
    if (!res.ok) {
      setT(s => ({ ...s, done: prev }))
      toast.error("Failed to update task")
    }
  }

  async function addLog(e: React.FormEvent) {
    e.preventDefault()
    if (!notes.trim()) {
      toast.error("Notes required")
      return
    }

    const tempId = `temp_${Date.now()}`
    const optimisticLog: Log = {
      id: tempId,
      date: new Date(date).toISOString(),
      content: notes.trim(),
      attachment: attachment.trim() || null,
    }

    // optimistic add on top
    startTransition(() => setOptimistic(cur => [optimisticLog, ...cur]))

    const res = await fetch(`/api/projects/${projectId}/tasks/${t.id}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        content: notes.trim(),
        attachment: attachment.trim() || null,
      }),
    })

    if (!res.ok) {
      // revert
      setOptimistic(cur => cur.filter(l => l.id !== tempId))
      toast.error("Failed to save log")
      return
    }

    const created: Log = await res.json()
    setLogs(cur => [created, ...cur.filter(l => l.id !== tempId)])
    setDate(new Date().toISOString().slice(0, 10))
    setNotes("")
    setAttachment("")
    toast.success("Log saved")
  }

  async function sendForReview() {
    const reviewer = window.prompt("Reviewer email (manager/director/peer):")
    if (!reviewer) return
    const note = window.prompt("Optional note to reviewer:") || ""

    const res = await fetch(`/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        taskId: t.id,
        reviewerEmail: reviewer,
        note,
      }),
    })

    if (!res.ok) {
      toast.error("Failed to send review request")
      return
    }
    toast.success("Review request sent")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">
            Due: <span className="font-medium">{t.due ? new Date(t.due).toLocaleDateString() : "—"}</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Checkbox checked={t.done} onCheckedChange={(v) => toggleDone(Boolean(v))} />
            <span className="text-sm">Mark complete</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}`}>← Back to Project</Link>
          </Button>
          <Button onClick={sendForReview}>Send for review</Button>
        </div>
      </div>

      {/* Add Daily Log */}
      <div className="rounded-lg border">
        <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">Add Daily Log</div>
        <form onSubmit={addLog} className="space-y-3 p-3">
          <div className="grid gap-1">
            <label htmlFor="date" className="text-sm font-medium">Work date</label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div className="grid gap-1">
            <label htmlFor="notes" className="text-sm font-medium">Notes</label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="What did you do today?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="attachment" className="text-sm font-medium">Attachment (URL)</label>
            <Input
              id="attachment"
              type="url"
              placeholder="https://…"
              value={attachment}
              onChange={(e) => setAttachment(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit">Save Log</Button>
          </div>
        </form>
      </div>

      {/* Logs */}
      <div className="rounded-lg border">
        <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
          Daily Logs ({optimistic.length})
        </div>
        <ul className="divide-y">
          {optimistic.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No logs yet.</li>
          )}
          {optimistic.map((l) => (
            <li key={l.id} className="px-3 py-3">
              <div className="flex items-baseline justify-between gap-4">
                <div className="text-sm font-medium">
                  {new Date(l.date).toLocaleDateString()}
                </div>
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
