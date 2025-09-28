"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type MemberDTO = {
  userId: string
  name: string
  email: string
  role: "DIRECTOR" | "MANAGER" | "CONSULTANT"
}

export default function MembersPanel({ projectId }: { projectId: string }) {
  const qc = useQueryClient()

  const membersQ = useQuery({
    queryKey: ["members", projectId],
    queryFn: async (): Promise<MemberDTO[]> => {
      const res = await fetch(`/api/projects/${projectId}/members`)
      if (!res.ok) throw new Error("Failed to load members")
      return res.json()
    },
  })

  const addMember = useMutation({
    mutationFn: async (body: { email: string; role: MemberDTO["role"] }) => {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Failed to add member")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Member added")
      qc.invalidateQueries({ queryKey: ["members", projectId] })
      setEmail("")
      setRole("CONSULTANT")
    },
    onError: (e: any) => toast.error(e.message || "Failed to add member"),
  })

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Failed to remove member")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Member removed")
      qc.invalidateQueries({ queryKey: ["members", projectId] })
    },
    onError: (e: any) => toast.error(e.message || "Failed to remove member"),
  })

  const [email, setEmail] = useState("")
  const [role, setRole] = useState<MemberDTO["role"]>("CONSULTANT")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List */}
        {membersQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {membersQ.error && <p className="text-sm text-red-500">Failed to load members</p>}
        {membersQ.data && membersQ.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        )}
        {membersQ.data && membersQ.data.length > 0 && (
          <div className="flex flex-col gap-2">
            {membersQ.data.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{m.name ?? m.email}</div>
                  <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.role === "DIRECTOR" ? "outline" : m.role === "MANAGER" ? "secondary" : "default"}>
                    {m.role}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMember.mutate(m.userId)}
                    disabled={removeMember.isPending}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add form (directors/managers should use this; consultants will be blocked by API) */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="memberEmail">Add member by email</Label>
            <Input
              id="memberEmail"
              placeholder="someone@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="memberRole">Role</Label>
            <select
              id="memberRole"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as MemberDTO["role"])}
            >
              <option value="CONSULTANT">CONSULTANT</option>
              <option value="MANAGER">MANAGER</option>
              <option value="DIRECTOR">DIRECTOR</option>
            </select>
          </div>
        </div>
        <Button
          onClick={() => addMember.mutate({ email, role })}
          disabled={addMember.isPending || !email}
        >
          {addMember.isPending ? "Adding…" : "Add member"}
        </Button>
      </CardContent>
    </Card>
  )
}
