import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type Task = {
  id: string
  title: string
  project?: string
  due?: string
  done?: boolean
}

type TaskState = {
  tasks: Task[]
  addTask: (t: Omit<Task, "id">) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
  clearDone: () => void
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [
        { id: "t-001", title: "Draft control matrix", project: "Compliance 2.0", due: "2025-09-05", done: false },
      ],
      addTask: (t) =>
        set((s) => ({
          tasks: [{ id: crypto.randomUUID(), ...t }, ...s.tasks],
        })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)),
        })),
      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((x) => x.id !== id),
        })),
      clearDone: () =>
        set((s) => ({
          tasks: s.tasks.filter((x) => !x.done),
        })),
    }),
    {
      name: "remora-tasks",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ tasks: s.tasks }),
    }
  )
)
