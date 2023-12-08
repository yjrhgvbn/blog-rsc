import type { DefaultSession } from "next-auth";
import type { RoleTypes } from "@repo/db/types";
import type { SessionContextValue } from "next-auth/react";
import { useSession as useAuthSession } from "next-auth/react";

export { SessionProvider, signIn, signOut } from "next-auth/react";

interface Session extends DefaultSession {
  user?: DefaultSession["user"] & {
    id: string;
    role: RoleTypes[];
  };
}

// @ts-expect-error
export const useSession: () => Session & SessionContextValue = useAuthSession;
