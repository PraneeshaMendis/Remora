"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Attachment {
  id: string
  filename: string
  url: string
  uploadedBy: string
  createdAt: string
  uploader?: { name: string; email: string }
}

export default function AttachmentsPanel({ projectId, taskId }: { projectId: string; taskId: string }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ filename: "", url: "" })

  const { data, isLoading, error } = useQuery<Attachment[]>({
    queryKey: ["attachments", projectId, taskId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/attachments`)
      if (!res.ok) throw new Error("Failed to fetch attachments")
      return res.json()
    },
  })

  const create = useMutation({
    mutationFn: async (values: { filename: string; url: string }) => {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Failed to add attachment")
      return res.json()
    },
    onSuccess: () => {
      setForm({ filename: "", url: "" })
      qc.invalidateQueries({ queryKey: ["attachments", projectId, taskId] })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/attachments?id=${id}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Failed to delete attachment")
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attachments", projectId, taskId] })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add new attachment */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate(form)
          }}
          className="mb-4 space-y-2"
        >
          <div className="space-y-1">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={form.filename}
              onChange={(e) => setForm({ ...form, filename: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              required
            />
          </div>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Adding..." : "Add Attachment"}
          </Button>
        </form>

        {/* List attachments */}
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">Failed to load attachments</p>}
        {data && data.length === 0 && <p>No attachments yet.</p>}
        {data && data.length > 0 && (
          <ul className="space-y-2">
            {data.map((a) => (
              <li key={a.id} className="flex items-center justify-between border p-2 rounded">
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {a.filename}
                </a>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>by {a.uploader?.name ?? a.uploadedBy}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => remove.mutate(a.id)}
                    disabled={remove.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
