import { NextResponse } from 'next/server';

type HealthResponse = {
  status: 'ok';
  timestamp: string;
  service: 'insightdash';
};

export async function GET(): Promise<Response> {
  const payload: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'insightdash',
  };
  return NextResponse.json(payload, { status: 200 });
}
