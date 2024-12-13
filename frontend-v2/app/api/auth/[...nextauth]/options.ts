import type { NextAuthOptions } from "next-auth";
import { PrismaClient } from '@prisma/client'
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
      // TODO (WINSTON):
      // 1) database table setup
      // 2) we want to query the database
      // 3) use prisma orm to query the database (a lot of tutorials in docs or youtube)
      // 4) build the logic to authenticate here

      const prisma = new PrismaClient()
      // By unique identifier
      const users = await prisma.email_Access.findMany({where: {email: user.email}})
      if(users.length > 0){
        return !users[0].blacklisted
      }
      return false


    },

    },
};
