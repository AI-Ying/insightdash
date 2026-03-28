import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceMembership } from "@/lib/api-utils";
import { parseCSV } from "@/lib/csv-parser";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const dataSources = await prisma.dataSource.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { datasets: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(dataSources);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!file.name.endsWith(".csv")) {
    return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 });
  }

  // 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const csvText = await file.text();
  let parsed;
  try {
    parsed = parseCSV(csvText);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to parse CSV" },
      { status: 400 }
    );
  }

  const dsName = name || file.name.replace(/\.csv$/i, "");

  const dataSource = await prisma.dataSource.create({
    data: {
      name: dsName,
      type: "CSV",
      config: JSON.stringify({ originalName: file.name, rowCount: parsed.rowCount }),
      workspaceId,
      datasets: {
        create: {
          name: dsName,
          schema: JSON.stringify({ columns: parsed.columns, rows: parsed.rows }),
        },
      },
    },
    include: {
      datasets: { select: { id: true, name: true } },
      _count: { select: { datasets: true } },
    },
  });

  return NextResponse.json(dataSource, { status: 201 });
}
