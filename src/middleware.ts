import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const role = (token?.role as string | undefined) || ""
      const path = req.nextUrl.pathname

      // 🔒 Directors-only area
      if (path.startsWith("/dashboard/users")) {
        return role === "DIRECTOR"
      }

      // Existing protection
      if (path.startsWith("/dashboard") || path.startsWith("/projects")) {
        return role === "DIRECTOR" || role === "MANAGER" || role === "CONSULTANT"
      }

      return !!token
    },
  },
})

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*"],
}
