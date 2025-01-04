import type { NextAuthOptions } from "next-auth";
import { PrismaClient } from "@prisma/client";
import GoogleProvider from "next-auth/providers/google";

export const options: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user }) {
      const prisma = new PrismaClient();

      // Ensure user.email is not null or undefined
      if (!user.email) {
        return false;
      }

      try {
        // Query the database for the email
        const users = await prisma.email_Access.findMany({
          where: { email: user.email },
        });

        // Return true if user is found and not blacklisted, otherwise false
        if (users.length > 0) {
          return !users[0].blacklisted;
        }

        // If no user is found, deny access
        return false;
      } catch (error) {
        console.error("Error querying the database:", error);
        return false; // Deny access in case of any errors
      } finally {
        // Ensure PrismaClient is disconnected to avoid memory leaks
        await prisma.$disconnect();
      }
    },
  },
};
