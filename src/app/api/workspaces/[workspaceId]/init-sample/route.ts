import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceMembership } from "@/lib/api-utils";
import { parseCSV } from "@/lib/csv-parser";
import { SAMPLE_DATA, API_TIMEOUT } from "@/lib/constants";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const result = await verifyWorkspaceMembership(workspaceId);
  if ("error" in result) return result.error;

  // Check if sample data already exists
  const existingDs = await prisma.dataSource.findFirst({
    where: { workspaceId, name: "工厂传感器示例数据" },
  });

  if (existingDs) {
    return NextResponse.json(
      { error: "Sample data already exists", dataSourceId: existingDs.id },
      { status: 400 }
    );
  }

  // Fetch the sample CSV
  const csvResponse = await fetch(SAMPLE_DATA.SENSORS, {
    signal: AbortSignal.timeout(API_TIMEOUT.DEFAULT),
  });

  if (!csvResponse.ok) {
    return NextResponse.json(
      { error: "Failed to fetch sample CSV" },
      { status: 500 }
    );
  }

  const csvText = await csvResponse.text();
  let parsed;
  try {
    parsed = parseCSV(csvText);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to parse sample CSV" },
      { status: 500 }
    );
  }

  // Create data source and dataset
  const dataSource = await prisma.dataSource.create({
    data: {
      name: "工厂传感器示例数据",
      type: "CSV",
      config: JSON.stringify({
        originalName: "factory_sensors.csv",
        rowCount: parsed.rowCount,
        isSample: true,
      }),
      workspaceId,
      datasets: {
        create: {
          name: "传感器实时数据",
          schema: JSON.stringify({ columns: parsed.columns, rows: parsed.rows }),
        },
      },
    },
    include: {
      datasets: true,
    },
  });

  const datasetId = dataSource.datasets[0].id;

  // Create sample dashboard with widgets
  const dashboard = await prisma.dashboard.create({
    data: {
      title: "工厂监控仪表板",
      description: "传感器实时监控示例仪表板",
      workspaceId,
      createdById: result.session.user.id,
      widgets: {
        create: [
          {
            title: "温度趋势",
            type: "LINE_CHART",
            config: JSON.stringify({
              xField: "timestamp",
              yField: "temperature",
              aggregation: "avg",
            }),
            position: JSON.stringify({ col: 0, row: 0, w: 1, h: 2 }),
            datasetId,
          },
          {
            title: "压力分布",
            type: "BAR_CHART",
            config: JSON.stringify({
              xField: "device_id",
              yField: "pressure",
              aggregation: "avg",
            }),
            position: JSON.stringify({ col: 1, row: 0, w: 1, h: 2 }),
            datasetId,
          },
          {
            title: "告警状态",
            type: "PIE_CHART",
            config: JSON.stringify({
              categoryField: "alarm",
              valueField: "alarm",
              aggregation: "count",
            }),
            position: JSON.stringify({ col: 0, row: 2, w: 1, h: 2 }),
            datasetId,
          },
          {
            title: "关键指标",
            type: "KPI_CARD",
            config: JSON.stringify({
              valueField: "temperature",
              aggregation: "avg",
            }),
            position: JSON.stringify({ col: 1, row: 2, w: 1, h: 2 }),
            datasetId,
          },
        ],
      },
    },
    include: {
      widgets: true,
    },
  });

  return NextResponse.json(
    {
      success: true,
      dataSourceId: dataSource.id,
      datasetId,
      dashboardId: dashboard.id,
    },
    { status: 201 }
  );
}
