"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FolderKanban, ListChecks } from "lucide-react"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects",  label: "Projects",  icon: FolderKanban },
  { href: "/tasks",     label: "Tasks",     icon: ListChecks },
]

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ComponentType<any>
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        "transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  )
}

export default function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r bg-card/70 p-3 backdrop-blur dark:bg-card/60">
      {/* Brand */}
      <div className="mb-3 px-2">
        <div className="text-xl font-semibold tracking-tight">Remora</div>
        <div className="text-xs text-muted-foreground">GRC dashboard</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-1">
        {links.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href || pathname.startsWith(href + "/")}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-3 border-t pt-3 px-2 text-xs text-muted-foreground">
        v0.1.0 • local
      </div>
    </aside>
  )
}
