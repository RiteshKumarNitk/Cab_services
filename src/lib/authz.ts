import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "./auth";
import { hasRole } from "./authz-roles";

export * from "./authz-roles";

export type AuthedSession = Session & { user: { id: string; role: string } };

/**
 * Resolve the session and require one of `roles`.
 * Returns either the session or a ready-to-return error response.
 */
export async function requireRole(
  roles: readonly string[]
): Promise<{ session: AuthedSession; error?: never } | { session?: never; error: NextResponse }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasRole(session.user.role, roles)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session: session as AuthedSession };
}
