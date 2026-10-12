import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { Prisma } from "@prisma/client";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function userFromGoogle(email: string, name?: string | null) {
  const normalized = email.toLowerCase().trim();
  const displayName = name?.trim() || normalized.split("@")[0] || "Traveler";
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) return existing;

  try {
    return await prisma.user.create({
      data: { email: normalized, name: displayName },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const created = await prisma.user.findUnique({ where: { email: normalized } });
      if (created) return created;
    }
    throw error;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      const googleProfile = profile as { email?: string; email_verified?: boolean } | undefined;
      return googleProfile?.email_verified === true && Boolean(googleProfile.email);
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        const dbUser = await userFromGoogle(user.email, user.name);
        token.id = dbUser.id;
        token.email = dbUser.email;
        token.name = dbUser.name;
        return token;
      }
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
