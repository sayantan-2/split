import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, passwords } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // Use Drizzle adapter for NextAuth
  adapter: DrizzleAdapter(db),
  
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1);

          if (user.length === 0) {
            return null;
          }

          // Get user's password
          const userPassword = await db
            .select()
            .from(passwords)
            .where(eq(passwords.userId, user[0].id))
            .limit(1);

          if (userPassword.length === 0) {
            return null;
          }

          // Verify password
          const isValid = await bcrypt.compare(
            credentials.password,
            userPassword[0].hashedPassword
          );

          if (!isValid) {
            return null;
          }

          // Return user object
          return {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name,
            image: user[0].avatar,
          };
        } catch (error) {
          console.error("Error during authentication:", error);
          return null;
        }
      }
    })
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
