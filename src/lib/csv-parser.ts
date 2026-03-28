import Papa from "papaparse";

export interface ParsedCSV {
  columns: { name: string; type: "string" | "number" | "date" }[];
  rows: Record<string, string | number>[];
  rowCount: number;
}

/**
 * Parse a CSV string into structured columns + rows with inferred types.
 * Limits to 10,000 rows max for storage in JSON field.
 */
export function parseCSV(csvString: string): ParsedCSV {
  const result = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }

  const rawRows = result.data as Record<string, unknown>[];
  const fields = result.meta.fields || [];

  // Infer column types from first 100 rows
  const columns = fields.map((name) => {
    let numCount = 0;
    let dateCount = 0;
    const sampleSize = Math.min(rawRows.length, 100);

    for (let i = 0; i < sampleSize; i++) {
      const val = rawRows[i][name];
      if (val === null || val === undefined || val === "") continue;
      if (typeof val === "number" || (!isNaN(Number(val)) && String(val).trim() !== "")) {
        numCount++;
      } else if (typeof val === "string" && !isNaN(Date.parse(val)) && val.length > 6) {
        dateCount++;
      }
    }

    const threshold = sampleSize * 0.6;
    let type: "string" | "number" | "date" = "string";
    if (numCount > threshold) type = "number";
    else if (dateCount > threshold) type = "date";

    return { name, type };
  });

  // Convert rows, coerce numbers
  const MAX_ROWS = 10000;
  const rows = rawRows.slice(0, MAX_ROWS).map((row) => {
    const clean: Record<string, string | number> = {};
    for (const col of columns) {
      const val = row[col.name];
      if (col.type === "number" && val !== null && val !== undefined && val !== "") {
        clean[col.name] = Number(val);
      } else {
        clean[col.name] = val == null ? "" : String(val);
      }
    }
    return clean;
  });

  return { columns, rows, rowCount: rawRows.length };
}
