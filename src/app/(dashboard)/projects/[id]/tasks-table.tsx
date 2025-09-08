"use client"

import TaskRow from "./task-row"

type Task = {
  id: string
  title: string
  done: boolean
  due: string | null
}

export default function TasksTable({ initial }: { initial: Task[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="w-10 px-4 py-2 font-medium">✔</th>
            <th className="px-4 py-2 font-medium">Task</th>
            <th className="w-28 px-4 py-2 font-medium">Due</th>
            <th className="w-32 px-4 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {initial.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}

          {initial.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                No tasks yet — add one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
