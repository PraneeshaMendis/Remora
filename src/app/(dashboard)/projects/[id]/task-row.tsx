"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUpdateTask, useDeleteTask, useToggleTask } from "@/lib/api"

type Task = {
  id: string
  title: string
  done: boolean
  due: string | null
}

export default function TaskRow({ task }: { task: Task }) {
  const router = useRouter()
  const qc = useQueryClient()

  const update = useUpdateTask()
  const toggle = useToggleTask()
  const del = useDeleteTask()

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)

  async function refreshAll() {
    // Refresh the current server page (SSR) and bust any client caches
    router.refresh()
    qc.invalidateQueries({ queryKey: ["tasks"] })
    qc.invalidateQueries({ queryKey: ["projects"] })
  }

  async function saveTitle() {
    const t = title.trim()
    if (!t || t === task.title) {
      setEditing(false)
      setTitle(task.title)
      return
    }
    await update.mutateAsync({ id: task.id, title: t })
    setEditing(false)
    await refreshAll()
  }

  async function toggleDone() {
    await toggle.mutateAsync({ id: task.id, done: !task.done })
    await refreshAll()
  }

  async function deleteRow() {
    await del.mutateAsync(task.id)
    await refreshAll()
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-2 align-middle">
        <input type="checkbox" checked={task.done} onChange={toggleDone} />
      </td>

      <td className="px-4 py-2">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveTitle()
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-sm"
            />
            <Button type="submit" size="sm">
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(false)
                setTitle(task.title)
              }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <span
            className={task.done ? "line-through text-muted-foreground" : ""}
            onDoubleClick={() => setEditing(true)}
          >
            {task.title}
          </span>
        )}
      </td>

      <td className="px-4 py-2">
        {task.due ? new Date(task.due).toLocaleDateString() : "—"}
      </td>

      <td className="flex gap-2 px-4 py-2">
        {!editing && (
          <>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={deleteRow}>
              Delete
            </Button>
          </>
        )}
      </td>
    </tr>
  )
}
