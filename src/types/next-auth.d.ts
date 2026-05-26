import { DefaultSession, DefaultUser } from "next-auth";
import { UserRole, AccountStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: AccountStatus;
      trialEndDate?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    status: AccountStatus;
    trialEndDate?: Date | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: AccountStatus;
    trialEndDate?: string | null;
  }
}
