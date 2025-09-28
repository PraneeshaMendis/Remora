"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FolderKanban, ListChecks, Users } from "lucide-react"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects",  label: "Projects",  icon: FolderKanban },
  { href: "/tasks",     label: "Tasks",     icon: ListChecks },
]

function NavLink({ href, label, icon: Icon, active }: any) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
        active && "bg-accent"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  )
}

export default function AppSidebar() {
  const pathname = usePathname()
  const { data } = useSession()
  const role = (data?.user as any)?.role

  return (
    <aside className="w-56 border-r p-3">
      <nav className="space-y-1">
        {links.map(({ href, label, icon }, i) => (
          <NavLink
            key={i}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href || pathname.startsWith(href + "/")}
          />
        ))}

        {/* 👇 Only Directors see this link */}
        {role === "DIRECTOR" && (
          <NavLink
            href="/dashboard/users"
            label="Users"
            icon={Users}
            active={pathname === "/dashboard/users" || pathname.startsWith("/dashboard/users/")}
          />
        )}
      </nav>

      <div className="mt-3 border-t pt-3 px-2 text-xs text-muted-foreground">
        v0.1.0 • local
      </div>
    </aside>
  )
}
