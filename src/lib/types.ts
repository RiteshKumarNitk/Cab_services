import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      phone: string | null;
      profilePic: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    phone: string | null;
    profilePic: string | null;
  }
}


