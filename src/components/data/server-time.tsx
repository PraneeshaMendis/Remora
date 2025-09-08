"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"

type Health = { ok: boolean; message: string; serverTime: string }

export default function ServerTime() {
  const q = useQuery({
    queryKey: ["health"],
    queryFn: async (): Promise<Health> => {
      const res = await fetch("/api/health", { cache: "no-store" })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`GET /api/health ${res.status} ${res.statusText} ${text ? `— ${text}` : ""}`)
      }
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="text-sm">
        {q.isPending && <span>Checking server…</span>}
        {q.isError && <span className="text-red-600">Error: {(q.error as Error).message}</span>}
        {q.data && (
          <>
            <div className="font-medium">{q.data.message}</div>
            <div className="text-gray-600">
              Server time: {new Date(q.data.serverTime).toLocaleString()}
            </div>
          </>
        )}
      </div>
      <Button size="sm" variant="outline" onClick={() => q.refetch()} disabled={q.isFetching}>
        {q.isFetching ? "Refreshing…" : "Refresh"}
      </Button>
    </div>
  )
}

