"use client"

import { useState } from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useTasks, useCreateTask, useToggleTask, useDeleteTask, useProjectsLite } from "@/lib/api"

export default function TasksPage() {
  const [text, setText] = useState("")
  const [projectId, setProjectId] = useState<string | "">("")
  const [due, setDue] = useState<string>("")
  const { data, isLoading, isError, refetch } = useTasks()
  const { data: projects } = useProjectsLite()
  const create = useCreateTask()
  const toggle = useToggleTask()
  const del = useDeleteTask()

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 sm:grid-cols-[1fr_200px_180px_auto_auto] sm:items-center"
        onSubmit={async (e) => {
          e.preventDefault()
          const title = text.trim()
          if (!title) return
          await create.mutateAsync({
            title,
            projectId: projectId || null,
            due: due ? new Date(due).toISOString() : null,
          })
          setText(""); setProjectId(""); setDue("")
        }}
      >
        <input
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
          placeholder="Quick add task…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">No project</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-lg border px-3 py-2 text-sm"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Adding…" : "Add"}
        </Button>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </form>

      {isLoading && <div className="rounded-xl border bg-white p-6 text-sm">Loading tasks…</div>}
      {isError && (
        <div className="rounded-xl border bg-white p-6 text-sm text-red-600">
          Failed to load tasks. <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {data && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>✔</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggle.mutate({ id: t.id, done: !t.done })}
                  />
                </TableCell>
                <TableCell className={t.done ? "line-through text-gray-400" : ""}>
                  {t.title}
                </TableCell>
                <TableCell>{t.project?.name ?? "—"}</TableCell>
                <TableCell>{t.due ? new Date(t.due).toLocaleDateString() : "—"}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => del.mutate(t.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No tasks yet — add one above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
