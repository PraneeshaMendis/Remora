"use client"

import Link from "next/link"
import { useOptimistic, useState, useTransition } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useSendForReview } from "@/lib/api"
import { toast } from "sonner"

type Task = {
  id: string
  title: string
  done: boolean
  due: string | null
}

export default function TasksTable({
  projectId,
  initial,
}: {
  projectId: string
  initial: Task[]
}) {
  // local/optimistic state
  const [tasks, setTasks] = useState<Task[]>(initial)
  const [optimistic, setOptimistic] = useOptimistic(tasks)
  const [isPending, startTransition] = useTransition()

  // hook must live at component top-level (not inside a function)
  const sendReview = useSendForReview()

  async function toggleDone(taskId: string, next: boolean) {
    // optimistic update
    startTransition(() => {
      setOptimistic((cur) =>
        cur.map((t) => (t.id === taskId ? { ...t, done: next } : t)),
      )
    })

    // persist
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    })

    if (!res.ok) {
      // revert on error
      setOptimistic((cur) =>
        cur.map((t) => (t.id === taskId ? { ...t, done: !next } : t)),
      )
      console.error("Failed to update task")
      return
    }

    // sync local (keep simple and trust optimistic)
    setTasks((cur) =>
      cur.map((t) => (t.id === taskId ? { ...t, done: next } : t)),
    )
  }

  function onSendReview(taskId: string) {
    const note = window.prompt("Optional note for the reviewer?")
    sendReview.mutate(
      { projectId, taskId, note: note ?? "" },
      {
        onSuccess: () => toast.success("Review request sent"),
        onError: (e: any) => toast.error(e.message || "Failed to send"),
      },
    )
  }

  const rows = optimistic

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="w-12 px-3 py-2 text-left">Done</th>
            <th className="px-3 py-2 text-left">Title</th>
            <th className="w-40 px-3 py-2 text-left">Due</th>
            <th className="w-44 px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="px-3 py-2 align-middle">
                <Checkbox
                  checked={t.done}
                  disabled={isPending}
                  onCheckedChange={(val) => toggleDone(t.id, Boolean(val))}
                />
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/projects/${projectId}/tasks/${t.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {t.title}
                </Link>
              </td>
              <td className="px-3 py-2">
                {t.due ? new Date(t.due).toLocaleDateString() : "—"}
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSendReview(t.id)}
                    disabled={sendReview.isPending}
                  >
                    {sendReview.isPending ? "Sending…" : "Send for review"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                No tasks yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
