/**
 * API Data Source Parser
 * Fetches data from REST APIs and parses into Dataset format
 */

export interface ApiConfig {
  url: string;
  method: "GET";
  responsePath?: string;
  headers?: Record<string, string>;
}

export interface ParsedApiData {
  columns: { name: string; type: "string" | "number" | "date" }[];
  rows: Record<string, string | number>[];
  rowCount: number;
}

const MAX_ROWS = 10000;
const SAMPLE_SIZE = 100;

/**
 * Fetch data from API and parse into Dataset format
 */
export async function fetchApiData(config: ApiConfig): Promise<ParsedApiData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        ...config.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    let json = await response.json();

    // Extract nested array if responsePath provided
    if (config.responsePath) {
      json = getNestedValue(json, config.responsePath);
    }

    // Ensure array
    if (!Array.isArray(json)) {
      json = [json];
    }

    // Infer columns from data
    const columns = inferColumns(json);
    
    // Convert and limit rows
    const rows = json.slice(0, MAX_ROWS).map((row: Record<string, unknown>) => convertRow(row, columns));

    return {
      columns,
      rows,
      rowCount: json.length,
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout. Please try again.");
      }
      throw error;
    }
    throw new Error("Failed to fetch API data");
  }
}

/**
 * Get nested value from object using dot notation path
 * Supports: "results", "data.items", "items[0].data"
 */
function getNestedValue(obj: any, path: string): any {
  if (!path) return obj;
  
  const parts = path.split(".");
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) break;
    
    // Handle array index like "items[0]"
    const match = part.match(/^(\w+)\[(\d+)\]$/);
    if (match) {
      current = current[match[1]]?.[parseInt(match[2])];
    } else {
      current = current[part];
    }
  }
  
  return current;
}

/**
 * Infer columns from array of objects
 */
function inferColumns(data: any[]): { name: string; type: "string" | "number" | "date" }[] {
  if (data.length === 0) return [];
  
  const firstRow = data[0];
  if (typeof firstRow !== "object" || firstRow === null) {
    return [{ name: "value", type: inferValueType(firstRow) }];
  }
  
  const keys = Object.keys(firstRow);
  
  return keys.map(name => ({
    name,
    type: inferColumnType(data, name),
  }));
}

/**
 * Infer type of a column by sampling rows
 */
function inferColumnType(data: any[], key: string): "string" | "number" | "date" {
  let numCount = 0;
  let dateCount = 0;
  let nullCount = 0;
  
  for (let i = 0; i < SAMPLE_SIZE && i < data.length; i++) {
    const val = data[i]?.[key];
    
    if (val === null || val === undefined) {
      nullCount++;
      continue;
    }
    
    const strVal = String(val).trim();
    
    // Check number
    if (strVal !== "" && !isNaN(Number(val)) && !isNaN(parseFloat(val))) {
      numCount++;
    }
    
    // Check date (ISO format or common date patterns)
    if (typeof val === "string" && isDateString(val)) {
      dateCount++;
    }
  }
  
  const validCount = data.length - nullCount;
  if (validCount === 0) return "string";
  
  const threshold = validCount * 0.6;
  
  if (numCount > threshold && numCount >= dateCount) return "number";
  if (dateCount > threshold * 0.5) return "date";
  return "string";
}

/**
 * Infer type of a single value
 */
function inferValueType(val: any): "string" | "number" | "date" {
  if (val === null || val === undefined) return "string";
  if (typeof val === "number") return "number";
  if (typeof val === "string") {
    if (isDateString(val)) return "date";
    if (!isNaN(Number(val))) return "number";
  }
  return "string";
}

/**
 * Check if string looks like a date
 */
function isDateString(val: string): boolean {
  // ISO date pattern
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return true;
  // Common date patterns
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(val)) return true;
  return false;
}

/**
 * Convert row values based on column types
 */
function convertRow(
  row: any,
  columns: { name: string; type: string }[]
): Record<string, string | number> {
  if (typeof row !== "object" || row === null) {
    return { value: row as string | number };
  }
  
  const clean: Record<string, string | number> = {};
  
  for (const col of columns) {
    const val = row[col.name];
    
    if (val === null || val === undefined) {
      clean[col.name] = "";
    } else if (col.type === "number" && val !== "") {
      clean[col.name] = Number(val);
    } else {
      clean[col.name] = typeof val === "object" ? JSON.stringify(val) : String(val);
    }
  }
  
  return clean;
}

/**
 * Test API connection without saving
 */
export async function testApiConnection(config: ApiConfig): Promise<{
  success: boolean;
  preview?: ParsedApiData;
  error?: string;
}> {
  try {
    const data = await fetchApiData(config);
    return { success: true, preview: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
