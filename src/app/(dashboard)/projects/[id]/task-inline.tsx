"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useCreateTask } from "@/lib/api"
import { toast } from "sonner"

export default function AddTaskInline({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState("")
  const create = useCreateTask()

  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        const t = title.trim()
        if (!t) return
        await create.mutateAsync({ title: t, projectId })
        setTitle("")
        toast.success("Task added")
      }}
    >
      <input
        className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
        placeholder="Add a task to this project…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? "Adding…" : "Add Task"}
      </Button>
    </form>
  )
}
