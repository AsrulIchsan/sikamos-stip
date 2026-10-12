import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isActive: boolean;
      nrp?: string | null;
      nip?: string | null;
      username?: string | null;
      kelas?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: string;
    isActive: boolean;
    nrp?: string | null;
    nip?: string | null;
    username?: string | null;
    kelas?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isActive: boolean;
    nrp?: string | null;
    nip?: string | null;
    username?: string | null;
    kelas?: string;
  }
}

