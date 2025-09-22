"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Topbar() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const loading = status === "loading"
  const userEmail = session?.user?.email ?? ""
  const role = (session as any)?.role ?? "user"

  return (
    <header
      className="
        sticky top-0 z-50
        border-b
        bg-background/80
        supports-[backdrop-filter]:bg-background/60 backdrop-blur
      "
    >
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4">
        {/* Left: search (placeholder) */}
        <div className="flex-1">
          <Input placeholder="Search…" className="w-full max-w-md" />
        </div>

        {/* Theme toggle */}
       <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
        className="
        relative h-9 w-9 shrink-0 rounded-full border
        bg-background shadow-sm
        flex items-center justify-center
        transition-colors hover:bg-accent hover:text-accent-foreground
      "
        >
      <Sun
         className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        />
      <Moon
       className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
        </button>

        {/* Auth controls */}
        <div className="flex items-center gap-3">
          {!loading && session && (
            <>
              <div className="hidden text-sm text-muted-foreground sm:block">
                {userEmail}{" "}
                {role === "director" && (
                  <span className="ml-1 rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                    Director
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="shrink-0"
              >
                Logout
              </Button>
            </>
          )}

          {!loading && !session && (
            <Button
              size="sm"
              onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
              className="shrink-0"
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
