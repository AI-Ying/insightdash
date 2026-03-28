import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceMembership } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const datasets = await prisma.dataset.findMany({
    where: {
      dataSource: { workspaceId },
    },
    select: {
      id: true,
      name: true,
      schema: true,
      dataSource: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(datasets);
}
