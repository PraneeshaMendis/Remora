"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"

type User = { id: string; name: string; email: string }
type Member = { projectId: string; userId: string; role: string | null; user: User }

export default function MembersPanel({ projectId }: { projectId: string }) {
  const qc = useQueryClient()
  const [pick, setPick] = useState<string>("")

  // 1) Load all users (for the dropdown)
  const users = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to load users")
      return (await res.json()) as User[]
    },
  })

  // 2) Load current members for this project
  const members = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/members`)
      if (!res.ok) throw new Error("Failed to load members")
      return (await res.json()) as Member[]
    },
  })

  // 3) Add a member
  const add = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error("Failed to add member")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members", projectId] })
      qc.invalidateQueries({ queryKey: ["projects"] }) // so counts update on list page
      setPick("")
    },
  })

  // 4) Remove a member
  const remove = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(
        `/api/projects/${projectId}/members?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Failed to remove member")
      return null
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members", projectId] })
      qc.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  const assignedIds = new Set(members.data?.map((m) => m.userId) ?? [])
  const available = (users.data ?? []).filter((u) => !assignedIds.has(u.id))

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Members</h2>

        <div className="flex items-center gap-2">
          <select
            className="rounded-md border px-2 py-1 text-sm"
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            disabled={users.isLoading}
          >
            <option value="">
              {users.isLoading ? "Loading users…" : "Select a user…"}
            </option>
            {available.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={() => pick && add.mutate(pick)}
            disabled={!pick || add.isPending}
          >
            {add.isPending ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>

      {/* Current members list */}
      <ul className="divide-y">
        {(members.data ?? []).map((m) => (
          <li key={m.userId} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3 min-w-0">
              {/* Simple initial bubble (no extra components needed) */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                {initials(m.user.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => remove.mutate(m.userId)}
              disabled={remove.isPending}
            >
              Remove
            </Button>
          </li>
        ))}

        {members.data && members.data.length === 0 && (
          <li className="py-4 text-sm text-muted-foreground">No members yet.</li>
        )}
      </ul>
    </div>
  )
}

function initials(name?: string) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : ""
  return (first + last).toUpperCase()
}
