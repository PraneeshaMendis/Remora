"use client"

import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ThemeToggle from "@/components/layout/theme-toggle"

export default function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        {/* Search */}
        <Input
          placeholder="Search…"
          className="h-10 w-full max-w-xl rounded-xl ring-1 ring-border focus-visible:ring-2"
        />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Avatar className="h-8 w-8 ring-1 ring-border">
            <AvatarFallback className="text-xs">PM</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
