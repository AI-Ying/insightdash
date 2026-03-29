import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errors } from "./api-response";

/**
 * Verifies current user is authenticated and a member of the given workspace.
 * Returns user session and workspace data, or a NextResponse error.
 */
export async function verifyWorkspaceMembership(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: errors.unauthorized(),
    };
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  if (!membership) {
    return {
      error: errors.forbidden(),
    };
  }

  return { session, membership };
}

/**
 * Create an error response with timeout context
 */
export function timeoutError() {
  return errors.serverError("请求超时，请稍后重试");
}

/**
 * Create a not found error for a specific resource
 */
export function notFoundError(resource: string) {
  return errors.notFound(resource);
}
