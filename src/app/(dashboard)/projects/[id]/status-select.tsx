"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const STATUSES = ["Active", "Planning", "OnHold", "Done"] as const

export default function StatusSelect({
  id,
  initial,
}: {
  id: string
  initial: (typeof STATUSES)[number]
}) {
  const [value, setValue] = useState<(typeof STATUSES)[number]>(initial)
  const [pending, start] = useTransition()
  const router = useRouter()
  const qc = useQueryClient()

  async function save() {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: value }),
    })
    if (!res.ok) {
      toast.error("Failed to update status")
      return
    }

    // 1) Re-render the server page so it shows the fresh DB value
    router.refresh()

    // 2) Invalidate client caches so the /projects list updates
    qc.invalidateQueries({ queryKey: ["projects"] })

    toast.success("Status updated")
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="rounded-lg border px-2 py-1 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value as any)}
        disabled={pending}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => start(save)}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  )
}
