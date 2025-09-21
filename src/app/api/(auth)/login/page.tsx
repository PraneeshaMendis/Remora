"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function DirectorLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 🔒 Placeholder logic: only allow emails that look like a director
    // (We'll replace this with real auth later.)
    const isDirector = /director|exec|ceo/i.test(email)
    if (!isDirector || password.length < 6) {
      setError("Invalid director credentials")
      setLoading(false)
      return
    }

    // Pretend “login” then go to dashboard
    router.push("/dashboard")
  }

  return (
    <div className="min-h-[calc(100vh-64px)] grid place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Director Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Director Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="director@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPw((s) => !s)}
                  className="whitespace-nowrap"
                >
                  {showPw ? "Hide" : "Show"}
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Directors only. We’ll connect real authentication next.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
