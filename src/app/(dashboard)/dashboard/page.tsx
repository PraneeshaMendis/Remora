import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import ServerTime from "@/components/data/server-time"

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>My Tasks (Today)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600">
          <div>
            No tasks due today. Create one from the <Link href="/tasks" className="underline">Tasks</Link> page.
          </div>
          <ServerTime />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>🎯 Project “Compliance 2.0” created</div>
          <div>🧩 Task “Map controls to risks” assigned to you</div>
        </CardContent>
      </Card>
    </div>
  )
}
