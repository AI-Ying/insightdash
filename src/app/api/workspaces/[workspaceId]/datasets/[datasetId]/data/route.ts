import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceMembership } from "@/lib/api-utils";
import type { DatasetSchema } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; datasetId: string }> }
) {
  const { workspaceId, datasetId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const dataset = await prisma.dataset.findFirst({
    where: {
      id: datasetId,
      dataSource: { workspaceId },
    },
    select: { id: true, name: true, schema: true },
  });

  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }

  let schema: DatasetSchema | null = null;
  if (dataset.schema) {
    try { schema = JSON.parse(dataset.schema as string) as DatasetSchema; } catch { /* ignore */ }
  }
  const rows = schema?.rows || [];
  const columns = schema?.columns || [];

  return NextResponse.json({ id: dataset.id, name: dataset.name, columns, rows });
}
