"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type ReviewItem = {
  id: string
  date: string
  content: string
  attachment: string | null
  taskId: string
  taskTitle: string
  projectId: string | null
  projectName: string
  requestedBy: string
}

export default function ReviewsPage() {
  const q = useQuery({
    queryKey: ["reviews"],
    queryFn: async (): Promise<ReviewItem[]> => {
      const res = await fetch("/api/reviews")
      if (!res.ok) throw new Error("Failed to load reviews")
      return res.json()
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Review requests</h1>

      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {q.error && <p className="text-red-500">Failed to load</p>}

      {q.data && q.data.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No review requests yet.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {q.data?.map((r) => (
          <Card key={r.id} className="transition-shadow hover:shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{r.taskTitle}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  in{" "}
                  {r.projectId ? (
                    <Link
                      href={`/projects/${r.projectId}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {r.projectName}
                    </Link>
                  ) : (
                    r.projectName
                  )}
                </div>
              </div>
              <Badge variant="outline">Review</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {new Date(r.date).toLocaleString()}
              </div>
              <div className="whitespace-pre-wrap text-sm">{r.content}</div>
              {r.attachment && (
                <a
                  href={r.attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline underline-offset-4"
                >
                  Attachment
                </a>
              )}
              {r.projectId && (
                <div className="pt-2 text-sm">
                  <Link
                    href={`/projects/${r.projectId}/tasks/${r.taskId}`}
                    className="underline-offset-4 hover:underline"
                  >
                    Open task →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
