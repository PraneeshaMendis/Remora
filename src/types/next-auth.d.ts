import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string
      role?: "DIRECTOR" | "MANAGER" | "CONSULTANT"
    }
  }

  interface User {
    id: string
    role?: "DIRECTOR" | "MANAGER" | "CONSULTANT"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: "DIRECTOR" | "MANAGER" | "CONSULTANT"
  }
}
