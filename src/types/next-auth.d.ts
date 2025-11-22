import { DefaultSession } from "next-auth"
import { UserRole } from "@/generated/prisma"

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole
    } & DefaultSession["user"]
  }
}

