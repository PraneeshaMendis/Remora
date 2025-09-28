"use client"

import { useEffect, useMemo, useState } from "react"

type InviteInfo = {
  email: string
  role: "DIRECTOR" | "MANAGER" | "LEAD" | "CONSULTANT" | "CLIENT"
  expiresAt: string
}

export default function InviteAcceptPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams?.token ?? ""
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<"valid" | "expired" | "used" | "not_found" | "error">("valid")
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitErr, setSubmitErr] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const strongEnough = useMemo(() => password.length >= 8, [password])
  const canSubmit = strongEnough && password === confirm && !!token

  useEffect(() => {
    let mounted = true
    async function run() {
      try {
        setLoading(true)
        const res = await fetch(`/api/invites?token=${encodeURIComponent(token)}`, { cache: "no-store" })
        if (res.status === 404) {
          if (mounted) setStatus("not_found")
          return
        }
        if (res.status === 410) {
          const data = await res.json()
          if (mounted) setStatus(data?.reason === "used" ? "used" : "expired")
          return
        }
        if (!res.ok) {
          if (mounted) setStatus("error")
          return
        }
        const data = await res.json()
        if (data?.valid && data.invite) {
          if (mounted) {
            setInvite({
              email: data.invite.email,
              role: data.invite.role,
              expiresAt: data.invite.expiresAt,
            })
            setStatus("valid")
          }
        } else {
          if (mounted) setStatus("error")
        }
      } catch {
        if (mounted) setStatus("error")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (token) run()
    else {
      setStatus("not_found")
      setLoading(false)
    }
    return () => {
      mounted = false
    }
  }, [token])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitErr(null)

    if (!canSubmit) return
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitErr(data?.error || "Unable to accept invite.")
        return
      }
      setSubmitted(true)
    } catch {
      setSubmitErr("Network error. Please try again.")
    }
  }

  return (
    <div className="mx-auto max-w-lg p-6 space-y-6">
      <h1 className="text-2xl font-bold">Accept Invitation</h1>

      {loading && <p className="text-sm text-gray-600">Verifying invite…</p>}

      {!loading && status !== "valid" && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {status === "not_found" && "This invite link is invalid."}
          {status === "expired" && "This invite has expired."}
          {status === "used" && "This invite has already been used."}
          {status === "error" && "Something went wrong verifying the invite."}
        </div>
      )}

      {!loading && status === "valid" && invite && !submitted && (
        <div className="space-y-4">
          <div className="rounded-md border p-3 text-sm">
            <div><span className="font-medium">Email:</span> {invite.email}</div>
            <div><span className="font-medium">Role:</span> {invite.role}</div>
          </div>

          {submitErr && (
            <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">
              {submitErr}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Full Name (optional)</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                type="password"
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {!strongEnough && password.length > 0 && (
                <p className="mt-1 text-xs text-red-600">Password must be at least 8 characters.</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {confirm && confirm !== password && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <a
                href="/login"
                className="rounded-md px-4 py-2 hover:bg-gray-100"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && submitted && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-700">
            Invitation accepted. You can now{" "}
            <a className="underline" href="/login">sign in</a>.
          </p>
        </div>
      )}
    </div>
  )
}
