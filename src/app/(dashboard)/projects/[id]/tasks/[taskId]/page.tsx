import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>
}) {
  const { id: projectId, taskId } = await params

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, done: true, due: true, projectId: true },
  })
  if (!task || task.projectId !== projectId) notFound()

  const logs = await prisma.taskLog.findMany({
    where: { taskId },
    orderBy: { date: "desc" },
    select: { id: true, date: true, content: true, attachment: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{task.title}</h1>
          <p className="text-sm text-muted-foreground">
            Task ID: <span className="font-mono">{task.id}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Due: <span className="font-medium">{task.due ? new Date(task.due).toLocaleDateString() : "—"}</span>
          </p>
        </div>
        <Link href={`/projects/${projectId}`} className="text-sm underline underline-offset-4">
          ← Back to Project
        </Link>
      </div>

      {/* Add Daily Log */}
      <div className="rounded-lg border">
        <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">Add Daily Log</div>
        <form
          action={`/api/projects/${projectId}/tasks/${taskId}/logs`}
          method="POST"
          className="space-y-3 p-3"
        >
          <div className="grid gap-1">
            <label htmlFor="date" className="text-sm font-medium">Work date</label>
            <input
              id="date"
              name="date"
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="notes" className="text-sm font-medium">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              placeholder="What did you do today?"
              className="w-full resize-y rounded-md border px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="attachment" className="text-sm font-medium">Attachment (URL)</label>
            <input
              id="attachment"
              name="attachment"
              type="url"
              placeholder="https://…"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="submit"
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted/60"
            >
              Save Log
            </button>
          </div>
        </form>
      </div>

      {/* Log history */}
      <div className="rounded-lg border">
        <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
          Daily Logs ({logs.length})
        </div>
        <ul className="divide-y">
          {logs.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No logs yet.</li>
          )}
          {logs.map((l) => (
            <li key={l.id} className="px-3 py-3">
              <div className="flex items-baseline justify-between gap-4">
                <div className="text-sm font-medium">
                  {new Date(l.date).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm">{l.content}</div>
              {l.attachment && (
                <div className="mt-1">
                  <a
                    href={l.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline underline-offset-4"
                  >
                    View attachment
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
