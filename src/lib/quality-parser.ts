/**
 * Quality Data Parser
 * Parses quality CSV data and provides aggregation/analysis functions
 */

export interface QualityRecord {
  timestamp: string;
  workshop: string;
  line: string;
  device: string;
  total: number;
  good: number;
  defect: number;
  defectCode: string;
}

export interface AggregatedMetrics {
  workshop: string;
  line?: string;
  device?: string;
  total: number;
  good: number;
  defect: number;
  goodRate: number;
  defectRate: number;
}

export interface HourlyTrend {
  hour: string;
  goodRate: number;
  total: number;
  good: number;
  defect: number;
}

export interface Alert {
  timestamp: string;
  workshop: string;
  line: string;
  device: string;
  type: "warning" | "critical";
  message: string;
  value: number;
}

export interface DefectDistribution {
  code: string;
  name: string;
  count: number;
  percentage: number;
}

// Defect code mapping
export const DEFECT_NAMES: Record<string, string> = {
  P01: "气孔",
  P02: "裂纹",
  P03: "变形",
  P04: "尺寸偏差",
  P05: "外观缺陷",
  P99: "其他",
};

/**
 * Parse quality CSV text into QualityRecord array
 */
export function parseQualityCSV(csvText: string): QualityRecord[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const records: QualityRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    if (values.length !== headers.length) continue;

    const record: QualityRecord = {
      timestamp: values[headers.indexOf("timestamp")] || "",
      workshop: values[headers.indexOf("workshop")] || "",
      line: values[headers.indexOf("line")] || "",
      device: values[headers.indexOf("device")] || "",
      total: parseInt(values[headers.indexOf("total")] || "0", 10),
      good: parseInt(values[headers.indexOf("good")] || "0", 10),
      defect: parseInt(values[headers.indexOf("defect")] || "0", 10),
      defectCode: values[headers.indexOf("defect_code")] || "",
    };

    if (record.workshop && record.total > 0) {
      records.push(record);
    }
  }

  return records;
}

/**
 * Aggregate by workshop
 */
export function aggregateByWorkshop(records: QualityRecord[]): AggregatedMetrics[] {
  const map = new Map<string, AggregatedMetrics>();

  for (const r of records) {
    const key = r.workshop;
    const existing = map.get(key);

    if (existing) {
      existing.total += r.total;
      existing.good += r.good;
      existing.defect += r.defect;
    } else {
      map.set(key, {
        workshop: r.workshop,
        total: r.total,
        good: r.good,
        defect: r.defect,
        goodRate: 0,
        defectRate: 0,
      });
    }
  }

  // Calculate rates
  for (const m of map.values()) {
    m.goodRate = m.total > 0 ? (m.good / m.total) * 100 : 0;
    m.defectRate = m.total > 0 ? (m.defect / m.total) * 100 : 0;
  }

  return Array.from(map.values()).sort((a, b) => a.defectRate - b.defectRate);
}

/**
 * Aggregate by line within a workshop
 */
export function aggregateByLine(records: QualityRecord[], workshop?: string): AggregatedMetrics[] {
  const filtered = workshop ? records.filter((r) => r.workshop === workshop) : records;
  const map = new Map<string, AggregatedMetrics>();

  for (const r of filtered) {
    const key = `${r.workshop} > ${r.line}`;
    const existing = map.get(key);

    if (existing) {
      existing.total += r.total;
      existing.good += r.good;
      existing.defect += r.defect;
    } else {
      map.set(key, {
        workshop: r.workshop,
        line: r.line,
        total: r.total,
        good: r.good,
        defect: r.defect,
        goodRate: 0,
        defectRate: 0,
      });
    }
  }

  for (const m of map.values()) {
    m.goodRate = m.total > 0 ? (m.good / m.total) * 100 : 0;
    m.defectRate = m.total > 0 ? (m.defect / m.total) * 100 : 0;
  }

  return Array.from(map.values()).sort((a, b) => b.defectRate - a.defectRate);
}

/**
 * Aggregate by device
 */
export function aggregateByDevice(records: QualityRecord[], workshop?: string): AggregatedMetrics[] {
  const filtered = workshop ? records.filter((r) => r.workshop === workshop) : records;
  const map = new Map<string, AggregatedMetrics>();

  for (const r of filtered) {
    const key = `${r.workshop} > ${r.line} > ${r.device}`;
    const existing = map.get(key);

    if (existing) {
      existing.total += r.total;
      existing.good += r.good;
      existing.defect += r.defect;
    } else {
      map.set(key, {
        workshop: r.workshop,
        line: r.line,
        device: r.device,
        total: r.total,
        good: r.good,
        defect: r.defect,
        goodRate: 0,
        defectRate: 0,
      });
    }
  }

  for (const m of map.values()) {
    m.goodRate = m.total > 0 ? (m.good / m.total) * 100 : 0;
    m.defectRate = m.total > 0 ? (m.defect / m.total) * 100 : 0;
  }

  return Array.from(map.values()).sort((a, b) => b.defectRate - a.defectRate);
}

/**
 * Calculate 24h trend (hourly)
 */
export function calculate24hTrend(records: QualityRecord[]): HourlyTrend[] {
  const map = new Map<string, { total: number; good: number; defect: number }>();

  for (const r of records) {
    // Extract hour from timestamp
    const hour = r.timestamp.slice(0, 13); // "2026-03-29 00"
    const existing = map.get(hour);

    if (existing) {
      existing.total += r.total;
      existing.good += r.good;
      existing.defect += r.defect;
    } else {
      map.set(hour, { total: r.total, good: r.good, defect: r.defect });
    }
  }

  const trends: HourlyTrend[] = [];
  for (const [hour, data] of map) {
    trends.push({
      hour,
      goodRate: data.total > 0 ? (data.good / data.total) * 100 : 0,
      total: data.total,
      good: data.good,
      defect: data.defect,
    });
  }

  return trends.sort((a, b) => a.hour.localeCompare(b.hour));
}

/**
 * Check alert rules
 */
export function checkAlerts(records: QualityRecord[]): Alert[] {
  const alerts: Alert[] = [];

  // Overall rate
  const total = records.reduce((sum, r) => sum + r.total, 0);
  const good = records.reduce((sum, r) => sum + r.good, 0);
  const goodRate = total > 0 ? good / total : 0;

  if (goodRate < 0.90) {
    alerts.push({
      timestamp: new Date().toISOString(),
      workshop: "全局",
      line: "-",
      device: "-",
      type: "critical",
      message: `整体良品率严重偏低 (${(goodRate * 100).toFixed(1)}%)`,
      value: goodRate * 100,
    });
  } else if (goodRate < 0.95) {
    alerts.push({
      timestamp: new Date().toISOString(),
      workshop: "全局",
      line: "-",
      device: "-",
      type: "warning",
      message: `整体良品率偏低 (${(goodRate * 100).toFixed(1)}%)`,
      value: goodRate * 100,
    });
  }

  // Per workshop
  const byWorkshop = aggregateByWorkshop(records);
  for (const w of byWorkshop) {
    if (w.goodRate < 0.90) {
      alerts.push({
        timestamp: new Date().toISOString(),
        workshop: w.workshop,
        line: "-",
        device: "-",
        type: "critical",
        message: `${w.workshop} 良品率严重偏低 (${w.goodRate.toFixed(1)}%)`,
        value: w.goodRate,
      });
    } else if (w.goodRate < 0.95) {
      alerts.push({
        timestamp: new Date().toISOString(),
        workshop: w.workshop,
        line: "-",
        device: "-",
        type: "warning",
        message: `${w.workshop} 良品率偏低 (${w.goodRate.toFixed(1)}%)`,
        value: w.goodRate,
      });
    }
  }

  return alerts;
}

/**
 * Calculate defect distribution
 */
export function calculateDefectDistribution(records: QualityRecord[]): DefectDistribution[] {
  const map = new Map<string, number>();
  let totalDefects = 0;

  for (const r of records) {
    const count = map.get(r.defectCode) || 0;
    map.set(r.defectCode, count + r.defect);
    totalDefects += r.defect;
  }

  const distributions: DefectDistribution[] = [];
  for (const [code, count] of map) {
    distributions.push({
      code,
      name: DEFECT_NAMES[code] || code,
      count,
      percentage: totalDefects > 0 ? (count / totalDefects) * 100 : 0,
    });
  }

  return distributions.sort((a, b) => b.count - a.count);
}

/**
 * Get overall metrics
 */
export function getOverallMetrics(records: QualityRecord[]) {
  const total = records.reduce((sum, r) => sum + r.total, 0);
  const good = records.reduce((sum, r) => sum + r.good, 0);
  const defect = records.reduce((sum, r) => sum + r.defect, 0);

  return {
    total,
    good,
    defect,
    goodRate: total > 0 ? (good / total) * 100 : 0,
    defectRate: total > 0 ? (defect / total) * 100 : 0,
  };
}

/**
 * Get unique workshops
 */
export function getWorkshops(records: QualityRecord[]): string[] {
  const set = new Set(records.map((r) => r.workshop));
  return Array.from(set).sort();
}
