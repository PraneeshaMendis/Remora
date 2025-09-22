// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Director Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email ?? ""
        const password = credentials?.password ?? ""

        const directorEmail = process.env.DIRECTOR_EMAIL ?? ""
        const directorPassword = process.env.DIRECTOR_PASSWORD ?? ""

        if (email === directorEmail && password === directorPassword) {
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
      ;(session as any).role = (token as any).role ?? "user"
      return session
    },
  },
  pages: {
    signIn: "/login", // send unauthenticated users here
  },
}

// ✅ v4 route handlers export pattern:
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
