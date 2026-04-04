import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    const health = {
      status: dbHealth ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      services: {
        database: dbHealth ? "connected" : "disconnected",
        api: "running",
      },
      uptime: process.uptime(),
    };

    const statusCode = dbHealth ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Health check failed",
      },
      { status: 503 }
    );
  }
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
