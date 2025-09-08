"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function TasksSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="w-10 px-4 py-2 font-medium">✔</th>
            <th className="px-4 py-2 font-medium">Task</th>
            <th className="w-28 px-4 py-2 font-medium">Due</th>
            <th className="w-24 px-4 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 4 }).map((_, i) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-4 rounded" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-48" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-6 w-16 rounded" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
