"use client"

import { useEffect, useMemo, useState } from "react"

type Role = "DIRECTOR" | "MANAGER" | "LEAD" | "CONSULTANT" | "CLIENT"

type User = {
  id: string
  name: string
  email: string
  role: Role
  createdAt?: string
}

const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: "Director (full access)", value: "DIRECTOR" },
  { label: "Manager", value: "MANAGER" },
  { label: "Lead", value: "LEAD" },
  { label: "Consultant", value: "CONSULTANT" },
  { label: "Client", value: "CLIENT" },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  // Search / filter
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL")

  // Create User modal
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("CONSULTANT")
  const [error, setError] = useState<string | null>(null)

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<Role>("CONSULTANT")
  const [inviteHours, setInviteHours] = useState<number>(24)
  const [inviteErr, setInviteErr] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  // Reset password banner
  const [resetInfo, setResetInfo] = useState<{ email: string; temp: string } | null>(null)

  // Delete banner
  const [deleteInfo, setDeleteInfo] = useState<{ email: string } | null>(null)

  // Resend invite banner
  const [resendInfo, setResendInfo] = useState<{ email: string; link: string } | null>(null)

  const isValidEmail = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  )
  const isValidInviteEmail = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim()),
    [inviteEmail]
  )

  async function loadUsers() {
    try {
      setLoading(true)
      setPageError(null)
      const res = await fetch("/api/users", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load users.")
      setUsers(data.users as User[])
    } catch (e: any) {
      setPageError(e.message || "Failed to load users.")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Derived: filtered users
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      const roleOk = roleFilter === "ALL" ? true : u.role === roleFilter
      const textOk =
        q.length === 0 ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      return roleOk && textOk
    })
  }, [users, query, roleFilter])

  // Create user form helpers
  function resetForm() {
    setName("")
    setEmail("")
    setRole("CONSULTANT")
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Full name is required.")
      return
    }
    if (!email.trim() || !isValidEmail) {
      setError("A valid email address is required.")
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as any)?.error || "Failed to create user.")
        return
      }

      setUsers((prev) => [(data as any).user as User, ...prev])
      setIsOpen(false)
      resetForm()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Invite helpers
  function resetInvite() {
    setInviteEmail("")
    setInviteRole("CONSULTANT")
    setInviteHours(24)
    setInviteErr(null)
    setInviteLink(null)
  }

  function openInvitePrefilled(u: User) {
    setInviteEmail(u.email)
    setInviteRole(u.role)
    setInviteHours(24)
    setInviteErr(null)
    setInviteLink(null)
    setInviteOpen(true)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteErr(null)
    setInviteLink(null)

    if (!inviteEmail.trim() || !isValidInviteEmail) {
      setInviteErr("A valid email address is required.")
      return
    }
    const hrs = Number(inviteHours)
    if (Number.isNaN(hrs) || hrs < 1 || hrs > 168) {
      setInviteErr("Expiry must be between 1 and 168 hours.")
      return
    }

    try {
      setInviteSubmitting(true)
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          expiresInHours: hrs,
        }),
      })
      let data: any = null
      try {
        data = await res.json()
      } catch {
        /* ignore non-JSON */
      }

      if (!res.ok) {
        setInviteErr(data?.error || `Failed (HTTP ${res.status})`)
        return
      }

      setInviteLink(data.link as string)
      try {
        await navigator.clipboard.writeText(data.link as string)
      } catch {
        /* ignore */
      }
    } catch {
      setInviteErr("Network error. Please try again.")
    } finally {
      setInviteSubmitting(false)
    }
  }

  // Reset password action
  async function resetPassword(userId: string, email: string) {
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert((data as any)?.error || "Failed to reset password.")
        return
      }
      setResetInfo({ email, temp: (data as any).tempPassword as string })
    } catch {
      alert("Network error. Please try again.")
    }
  }

  // Delete user action
  async function deleteUser(userId: string, email: string) {
    const ok = window.confirm(`Delete user ${email}? This cannot be undone.`)
    if (!ok) return
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert((data as any)?.error || "Failed to delete user.")
        return
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setDeleteInfo({ email })
      setTimeout(() => setDeleteInfo(null), 5000)
    } catch {
      alert("Network error. Please try again.")
    }
  }

  // Resend invite action
  async function resendInvite(email: string, role: Role) {
    try {
      const res = await fetch("/api/invites/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert((data as any)?.error || "Failed to resend invite.")
        return
      }
      const link = (data as any)?.link as string
      setResendInfo({ email, link })
      try {
        await navigator.clipboard.writeText(link)
      } catch {
        /* ignore */
      }
      setTimeout(() => setResendInfo(null), 7000)
    } catch {
      alert("Network error. Please try again.")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <input
            type="text"
            className="w-full sm:w-64 rounded-md border px-3 py-2 outline-none focus:ring"
            placeholder="Search name, email, role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {/* Role filter */}
          <select
            className="w-full sm:w-48 rounded-md border bg-white px-3 py-2 outline-none focus:ring"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | "ALL")}
          >
            <option value="ALL">All roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {/* Actions */}
          <div className="flex gap-2">
            <button
              className="rounded-md border px-4 py-2 hover:bg-gray-50"
              onClick={() => {
                resetInvite()
                setInviteOpen(true)
              }}
            >
              Generate Invite
            </button>
            <button
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={() => setIsOpen(true)}
            >
              + Add User
            </button>
          </div>
        </div>
      </div>

      {/* Banners */}
      {resetInfo && (
        <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          Temporary password for <span className="font-medium">{resetInfo.email}</span>:{" "}
          <code className="rounded bg-yellow-100 px-1 py-0.5">{resetInfo.temp}</code>
          <button
            className="ml-3 underline"
            onClick={() => {
              navigator.clipboard.writeText(resetInfo.temp).catch(() => {})
            }}
          >
            Copy
          </button>
          <button className="ml-3 underline" onClick={() => setResetInfo(null)}>
            Dismiss
          </button>
        </div>
      )}

      {deleteInfo && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Deleted user <span className="font-medium">{deleteInfo.email}</span>.
        </div>
      )}

      {resendInfo && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          Invite link for <span className="font-medium">{resendInfo.email}</span> copied to clipboard:{" "}
          <span className="break-all underline">{resendInfo.link}</span>
        </div>
      )}

      {pageError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{pageError}</div>
      )}

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-[920px] w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Role</th>
              <th className="p-3 font-semibold w-[420px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3 text-gray-500" colSpan={4}>
                  Loading users…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="p-3 text-gray-500" colSpan={4}>
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    {ROLE_OPTIONS.find((r) => r.value === u.role)?.label ?? u.role}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-md border px-3 py-1 hover:bg-gray-50"
                        onClick={() => openInvitePrefilled(u)}
                        title="Generate a new invite with custom expiry"
                      >
                        Invite
                      </button>
                      <button
                        className="rounded-md border px-3 py-1 hover:bg-gray-50"
                        onClick={() => resendInvite(u.email, u.role)}
                        title="Resend (or create) a 24h invite and copy link"
                      >
                        Resend Invite
                      </button>
                      <button
                        className="rounded-md border px-3 py-1 hover:bg-gray-50"
                        onClick={() => resetPassword(u.id, u.email)}
                        title="Generate a temporary password"
                      >
                        Reset PW
                      </button>
                      <button
                        className="rounded-md border px-3 py-1 hover:bg-red-50 text-red-700 border-red-300"
                        onClick={() => deleteUser(u.id, u.email)}
                        title="Delete this user"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add New User</h2>
              <button
                className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(false)
                  resetForm()
                }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {email && !isValidEmail && (
                  <p className="mt-1 text-xs text-red-600">Please enter a valid email.</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Role</label>
                <select
                  className="w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-md px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setIsOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Generate Invite</h2>
              <button
                className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
                onClick={() => {
                  setInviteOpen(false)
                  resetInvite()
                }}
              >
                ✕
              </button>
            </div>

            {inviteErr && (
              <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
                {inviteErr}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  placeholder="new.user@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                {inviteEmail && !isValidInviteEmail && (
                  <p className="mt-1 text-xs text-red-600">Please enter a valid email.</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Role</label>
                <select
                  className="w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Expires (hours)</label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  value={inviteHours}
                  onChange={(e) => setInviteHours(Number(e.target.value))}
                />
                <p className="mt-1 text-xs text-gray-500">Default: 24 hours (max 168).</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-md px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setInviteOpen(false)
                    resetInvite()
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {inviteSubmitting ? "Generating…" : "Generate"}
                </button>
              </div>
            </form>

            {inviteLink && (
              <div className="mt-4 rounded-md border p-3 text-sm">
                <div className="mb-2 font-medium">Invitation Link</div>
                <div className="break-all">{inviteLink}</div>
                <div className="mt-2 text-xs text-gray-600">
                  The link has been copied to your clipboard.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
