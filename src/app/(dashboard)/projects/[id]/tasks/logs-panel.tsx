"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type LogItem = {
  id: string
  userId: string
  user?: { name: string; email: string }
  workDate: string
  startedAt: string | null
  endedAt: string | null
  notes: string | null
  createdAt: string
}

export default function LogsPanel({
  projectId,
  taskId,
}: {
  projectId: string
  taskId: string
}) {
  const qc = useQueryClient()

  // simple form state
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10)) // yyyy-mm-dd
  const [start, setStart] = useState<string>("")
  const [end, setEnd] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  const { data, isLoading, error } = useQuery<LogItem[]>({
    queryKey: ["logs", projectId, taskId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/logs`)
      if (!res.ok) throw new Error("Failed to load logs")
      return res.json()
    },
  })

  const addLog = useMutation({
    mutationFn: async () => {
      // combine date + time into ISO strings if provided
      const toISO = (d: string, t: string) =>
        d && t ? new Date(`${d}T${t}:00`).toISOString() : undefined

      const payload = {
        workDate: new Date(`${date}T00:00:00`).toISOString(),
        startedAt: start ? toISO(date, start) : undefined,
        endedAt: end ? toISO(date, end) : undefined,
        notes: notes || undefined,
      }

      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to add log")
      return res.json()
    },
    onSuccess: () => {
      setNotes("")
      setStart("")
      setEnd("")
      qc.invalidateQueries({ queryKey: ["logs", projectId, taskId] })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Work Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* create form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addLog.mutate()
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end">End</Label>
              <Input
                id="end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on?"
              rows={4}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={addLog.isPending}>
              {addLog.isPending ? "Saving..." : "Add Log"}
            </Button>
          </div>
        </form>

        {/* list logs */}
        {isLoading && <p>Loading logs…</p>}
        {error && <p className="text-red-500">Failed to load logs.</p>}
        {data && data.length === 0 && <p>No logs yet.</p>}
        {data && data.length > 0 && (
          <ul className="space-y-3">
            {data.map((l) => (
              <li key={l.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">
                    {new Date(l.workDate).toLocaleDateString()}
                  </span>
                  {l.startedAt && (
                    <span>
                      {new Date(l.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  {l.endedAt && (
                    <span>→ {new Date(l.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  )}
                  <span className="text-muted-foreground">
                    • by {l.user?.name ?? l.userId}
                  </span>
                </div>
                {l.notes && <p className="mt-2 text-sm">{l.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
