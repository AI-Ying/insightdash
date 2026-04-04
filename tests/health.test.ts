import { describe, it, expect } from 'vitest';
import { GET } from '../src/app/api/health/route';

describe('GET /api/health', () => {
  it('returns health payload with correct structure', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await (res as any).json();
    expect(data).toBeDefined();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('insightdash');
    expect(typeof data.timestamp).toBe('string');
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
