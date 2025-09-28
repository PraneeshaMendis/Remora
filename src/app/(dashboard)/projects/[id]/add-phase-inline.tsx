"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AddPhaseInline({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/phases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    setLoading(false)
    if (!res.ok) {
      // eslint-disable-next-line no-alert
      alert("Failed to create phase")
      return
    }
    setName("")
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} size="sm">New Phase</Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border p-3 space-y-3">
      <div className="grid gap-1">
        <Label htmlFor="phase-name">Phase name</Label>
        <Input
          id="phase-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Phase 1 — Discovery"
          required
        />
      </div>
      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Creating..." : "Create Phase"}
        </Button>
      </div>
    </form>
  )
}
