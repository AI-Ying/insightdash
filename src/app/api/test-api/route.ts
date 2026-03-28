import { NextResponse } from "next/server";
import { fetchApiData, type ApiConfig } from "@/lib/api-parser";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, method = "GET", responsePath } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid URL" }, { status: 400 });
    }

    const config: ApiConfig = { url, method, responsePath };
    const preview = await fetchApiData(config);

    return NextResponse.json({
      success: true,
      preview: {
        rowCount: preview.rowCount,
        columns: preview.columns.slice(0, 10), // Limit preview columns
        sampleRows: preview.rows.slice(0, 3),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch API",
      },
      { status: 400 }
    );
  }
}
