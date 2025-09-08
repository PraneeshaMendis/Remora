import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type Project = {
  id: string
  name: string
  status: "Active" | "Planning" | "On Hold" | "Done"
  description?: string
}

type ProjectState = {
  projects: Project[]
  createProject: (p: Omit<Project, "id">) => void
  removeProject: (id: string) => void
  updateStatus: (id: string, status: Project["status"]) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [
        { id: "p-001", name: "Compliance 2.0", status: "Active", description: "Core GRC modernization" },
        { id: "p-002", name: "Vendor Risk Pilot", status: "Planning", description: "Third-party risk PoC" },
      ],
      createProject: (p) =>
        set((s) => ({ projects: [{ id: crypto.randomUUID(), ...p }, ...s.projects] })),
      removeProject: (id) =>
        set((s) => ({ projects: s.projects.filter((x) => x.id !== id) })),
      updateStatus: (id, status) =>
        set((s) => ({
          projects: s.projects.map((x) => (x.id === id ? { ...x, status } : x)),
        })),
    }),
    {
      name: "remora-projects",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ projects: s.projects }),
    }
  )
)
