import { redirect } from "next/navigation";
import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getPrisma } from "@/lib/prisma";

export type CurrentUser = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
};

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const googleAuthConfigured = Boolean(googleClientId && googleClientSecret);

export const authOptions: NextAuthOptions = {
  providers: googleAuthConfigured
    ? [
        GoogleProvider({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!
        })
      ]
    : [],
  pages: {
    signIn: "/sign-in"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      await upsertUser({
        email: user.email,
        name: user.name,
        image: user.image
      });
      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;
      if (email) {
        const storedUser = await upsertUser({
          email,
          name: user?.name ?? token.name,
          image: user?.image ?? token.picture
        });
        token.userId = storedUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    }
  }
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const id = session?.user?.id;
  if (!email || !id) return null;
  const sessionUser = session.user;
  if (!sessionUser) return null;
  return {
    id,
    email,
    name: sessionUser.name,
    image: sessionUser.image
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

async function upsertUser(input: { email: string; name?: string | null; image?: string | null }) {
  const db = getPrisma();
  if (!db) {
    return {
      id: input.email,
      email: input.email,
      name: input.name ?? null,
      image: input.image ?? null
    };
  }

  return db.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      image: input.image
    },
    create: {
      email: input.email,
      name: input.name,
      image: input.image
    }
  });
}
