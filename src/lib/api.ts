"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

/* ===================== Projects ===================== */

export type ProjectDTO = {
  id: string
  name: string
  status: "Active" | "Planning" | "OnHold" | "Done"
  description?: string | null
  createdAt: string
  updatedAt: string
    _count?: {
    tasks: number
    members: number
  }
}

export function useProjects() {
  return useQuery<ProjectDTO[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { cache: "no-store" })
      if (!res.ok) throw new Error(`GET /api/projects ${res.status}`)
      return res.json()
    },
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      status: ProjectDTO["status"]
      description?: string
    }) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`POST /api/projects ${res.status}`)
      return (await res.json()) as ProjectDTO
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })
}

/** For selects (id + name only) */
export function useProjectsLite() {
  return useQuery<ProjectDTO[]>({
    queryKey: ["projects-lite"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { cache: "no-store" })
      if (!res.ok) throw new Error(`GET /api/projects ${res.status}`)
      return res.json()
    },
  })
}

/* ====================== Tasks ======================= */

export type TaskDTO = {
  id: string
  title: string
  done: boolean
  due: string | null
  projectId: string | null
  createdAt: string
  project?: { id: string; name: string } | null
}

export function useTasks() {
  return useQuery<TaskDTO[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks", { cache: "no-store" })
      if (!res.ok) throw new Error(`GET /api/tasks ${res.status}`)
      return res.json()
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { title: string; projectId?: string | null; due?: string | null }) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`POST /api/tasks ${res.status}`)
      return (await res.json()) as TaskDTO
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  })
}

export function useToggleTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; done: boolean }) => {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error(`PATCH /api/tasks ${res.status}`)
      return (await res.json()) as TaskDTO
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`DELETE /api/tasks ${res.status}`)
      return true
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  })
}
export function useUpdateTask() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (data: {
        id: string
        title?: string
        due?: string | null
        projectId?: string | null
        done?: boolean
      }) => {
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error(`PATCH /api/tasks ${res.status}`)
        return (await res.json()) as TaskDTO
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    })
  }
  
  