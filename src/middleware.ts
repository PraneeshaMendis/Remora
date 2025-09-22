import { withAuth } from "next-auth/middleware"

// Simple per-route role gates:
// - Directors: everything
// - Managers: dashboard, projects, tasks
// - Consultants: dashboard, tasks
const canAccess = (pathname: string, role?: string) => {
  if (!role) return false
  if (role === "DIRECTOR") return true

  if (role === "MANAGER") {
    return (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/projects") ||
      pathname.startsWith("/tasks")
    )
  }

  if (role === "CONSULTANT") {
    return (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/tasks")
    )
  }

  return false
}

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const role = (token as any)?.role as string | undefined
      const path = req.nextUrl.pathname
      return canAccess(path, role)
    },
  },
  pages: {
    signIn: "/login",
  },
})

// Protect app areas (add more as you build them)
export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/tasks/:path*"],
}
