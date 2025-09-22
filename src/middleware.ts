import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ token }) => {
      // allow only signed-in users with role "director"
      return token?.role === "director"
    },
  },
})

// Protect these routes
export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*"],
}

