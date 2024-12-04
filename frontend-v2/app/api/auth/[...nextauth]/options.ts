import type { NextAuthOptions } from "next-auth";
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
      const authenticatedEmail = process.env.AUTH_USERS;
      console.log(user.email);
      console.log(authenticatedEmail);
      if (user.email != authenticatedEmail) {
        return false;
      }
      return true;
    },
  },
};
