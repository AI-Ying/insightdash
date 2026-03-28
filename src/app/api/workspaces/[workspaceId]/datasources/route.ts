import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceMembership } from "@/lib/api-utils";
import { parseCSV } from "@/lib/csv-parser";
import { fetchApiData, type ApiConfig } from "@/lib/api-parser";
import { API_TEMPLATES } from "@/lib/constants";

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

  const contentType = request.headers.get("content-type") || "";

  // Handle JSON body (API data source)
  if (contentType.includes("application/json")) {
    const body = await request.json();
    return handleApiDataSource(workspaceId, body);
  }

  // Handle FormData (CSV upload)
  return handleCSVUpload(workspaceId, await request.formData());
}

async function handleApiDataSource(
  workspaceId: string,
  body: {
    type: "API";
    templateId?: string;
    name?: string;
    url?: string;
    method?: "GET";
    responsePath?: string;
  }
) {
  const { templateId, name, url, method = "GET", responsePath } = body;

  // Find template or validate custom URL
  let apiConfig: ApiConfig;
  let dsName: string;

  if (templateId) {
    const template = API_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 400 });
    }
    apiConfig = {
      url: template.url,
      method: template.method,
      responsePath: template.responsePath,
    };
    dsName = name || template.name;
  } else if (url) {
    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    apiConfig = { url, method, responsePath };
    dsName = name || "API Data Source";
  } else {
    return NextResponse.json(
      { error: "Either templateId or url is required" },
      { status: 400 }
    );
  }

  // Fetch and parse API data
  let parsed;
  try {
    parsed = await fetchApiData(apiConfig);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch API data" },
      { status: 400 }
    );
  }

  // Create data source with dataset
  const dataSource = await prisma.dataSource.create({
    data: {
      name: dsName,
      type: "API",
      config: JSON.stringify({
        templateId,
        url: apiConfig.url,
        method: apiConfig.method,
        responsePath: apiConfig.responsePath,
        fetchedAt: new Date().toISOString(),
      }),
      workspaceId,
      datasets: {
        create: {
          name: dsName,
          schema: JSON.stringify({
            columns: parsed.columns,
            rows: parsed.rows,
            rowCount: parsed.rowCount,
          }),
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

async function handleCSVUpload(workspaceId: string, formData: FormData) {
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
