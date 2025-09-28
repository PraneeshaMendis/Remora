"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

type Phase = { id: string; name: string; order: number }
type Props = {
  projectId: string
  initial: Phase[]
}

export default function PhasesPanel({ projectId, initial }: Props) {
  const router = useRouter()
  const [phases, setPhases] = React.useState(initial)
  const [name, setName] = React.useState("")
  const [pending, startTransition] = React.useTransition()
  const [err, setErr] = React.useState<string | null>(null)

  async function addPhase(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!name.trim()) return

    // optimistic add
    const temp: Phase = { id: "temp-" + Math.random(), name, order: phases.length }
    setPhases((p) => [...p, temp])

    const res = await fetch(`/api/projects/${projectId}/phases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })

    if (!res.ok) {
      setErr(`Failed (${res.status})`)
      // revert optimistic
      setPhases((p) => p.filter((x) => x.id !== temp.id))
      return
    }

    setName("")
    // revalidate the server component data
    startTransition(() => router.refresh())
  }

  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">Phases</div>

      <form onSubmit={addPhase} className="flex gap-2 p-3">
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Phase name (e.g., Phase 1)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted/60"
        >
          {pending ? "Adding…" : "Add phase"}
        </button>
      </form>

      {err && <p className="px-3 pb-2 text-sm text-red-500">{err}</p>}

      <ul className="divide-y">
        {phases.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">No phases yet.</li>
        ) : (
          phases
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((ph) => (
              <li key={ph.id} className="px-3 py-2 text-sm">
                <span className="mr-2 text-muted-foreground">#{ph.order + 1}</span>
                {ph.name}
              </li>
            ))
        )}
      </ul>
    </div>
  )
}
