import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { NextResponse } from "next/server"

const handler = NextAuth({
  providers: [
    Credentials({
      name: "Director Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = creds?.email?.toString() ?? ""
        const password = creds?.password?.toString() ?? ""

        // Simple “directors only” rule for now:
        // accept only the configured director account
        const directorEmail = process.env.DIRECTOR_EMAIL ?? ""
        const directorPassword = process.env.DIRECTOR_PASSWORD ?? ""

        if (!directorEmail || !directorPassword) {
          // Developer mistake: missing env vars
          throw new Error("Server missing DIRECTOR_* env vars")
        }

        if (email === directorEmail && password === directorPassword) {
          // minimal user object; can be expanded later
          return { id: "director", name: "Director", email, role: "director" as const }
        }

        return null
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role ?? "user"
      return token
    },
    async session({ session, token }) {
      ;(session as any).role = token.role ?? "user"
      return session
    },
  },
})

export { handler as GET, handler as POST }
