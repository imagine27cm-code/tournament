import type { NextAuthOptions } from "next-auth";
import type { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email/Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const authedUser: User & { role: "PLAYER" | "ADMIN" } = {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        };
        return authedUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        const role = (user as { role?: "PLAYER" | "ADMIN" }).role;
        if (role) token.role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid ?? session.user.id;
        session.user.role = token.role ?? session.user.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};

export type AuthedUser = {
  id: string;
  email: string;
  role: "PLAYER" | "ADMIN";
  name?: string | null;
};

