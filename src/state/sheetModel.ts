export const COLUMN_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
export const NUM_COLS = COLUMN_LETTERS.length;
export const NUM_ROWS = 16;

export type CellMap = Record<string, string>;

export const cellName = (col: number, row: number) => `${COLUMN_LETTERS[col]}${row + 1}`;

/** Parse "A1" → [col, row]. Returns null if invalid. */
export function parseCellId(id: string): [number, number] | null {
  const m = /^([A-H])([1-9][0-9]*)$/.exec(id.trim().toUpperCase());
  if (!m) return null;
  const col = COLUMN_LETTERS.indexOf(m[1] as (typeof COLUMN_LETTERS)[number]);
  const row = parseInt(m[2], 10) - 1;
  if (col < 0 || row < 0 || row >= NUM_ROWS) return null;
  return [col, row];
}

export function isValidCellId(id: string): boolean {
  return parseCellId(id) !== null;
}

/** Expand a range like "A1:B4" into cell ids, column-major order. */
export function expandRange(range: string): string[] {
  const m = /^([A-H])([1-9][0-9]*):([A-H])([1-9][0-9]*)$/.exec(range.trim().toUpperCase());
  if (!m) {
    // Single cell is also a valid "range".
    return isValidCellId(range) ? [range.trim().toUpperCase()] : [];
  }
  const c1 = COLUMN_LETTERS.indexOf(m[1] as (typeof COLUMN_LETTERS)[number]);
  const r1 = parseInt(m[2], 10) - 1;
  const c2 = COLUMN_LETTERS.indexOf(m[3] as (typeof COLUMN_LETTERS)[number]);
  const r2 = parseInt(m[4], 10) - 1;
  const colStart = Math.min(c1, c2);
  const colEnd = Math.max(c1, c2);
  const rowStart = Math.min(r1, r2);
  const rowEnd = Math.max(r1, r2);
  const ids: string[] = [];
  for (let c = colStart; c <= colEnd; c++) {
    for (let r = rowStart; r <= rowEnd; r++) {
      ids.push(cellName(c, r));
    }
  }
  return ids;
}

export interface RangeStats {
  range: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
}

/* ------------------------------------------------------------------ */
/* Formula evaluation                                                  */
/* ------------------------------------------------------------------ */

const isNumeric = (s: string) => s.trim() !== "" && !isNaN(Number(s));

/**
 * Evaluate a cell's raw string to its display value.
 * Supports =SUM/AVG/MIN/MAX/COUNT over ranges, cell refs, and + - * / arithmetic.
 */
export function evaluateCell(
  raw: string,
  cells: CellMap,
  visiting: Set<string> = new Set(),
  depth = 0,
): string {
  if (!raw.startsWith("=")) return raw;
  if (depth > 20) return "#CYCLE";

  let expr = raw.slice(1);

  // Aggregate functions over ranges.
  expr = expr.replace(
    /\b(SUM|AVG|MIN|MAX|COUNT)\s*\(\s*([A-H]\d+)\s*:\s*([A-H]\d+)\s*\)/gi,
    (_match, fn: string, a: string, b: string) => {
      const ids = expandRange(`${a}:${b}`);
      const nums = ids
        .map((id) => evaluateCell(cells[id] ?? "", cells, new Set(visiting), depth + 1))
        .filter(isNumeric)
        .map(Number);
      switch (fn.toUpperCase()) {
        case "SUM":
          return String(nums.reduce((x, y) => x + y, 0));
        case "AVG":
          return nums.length === 0 ? "0" : String(nums.reduce((x, y) => x + y, 0) / nums.length);
        case "MIN":
          return nums.length === 0 ? "0" : String(Math.min(...nums));
        case "MAX":
          return nums.length === 0 ? "0" : String(Math.max(...nums));
        case "COUNT":
          return String(nums.length);
        default:
          return "0";
      }
    },
  );

  // Single-cell references.
  expr = expr.replace(/\b([A-H]\d+)\b/g, (id) => {
    if (visiting.has(id)) return "#CYCLE";
    const next = new Set(visiting);
    next.add(id);
    const value = evaluateCell(cells[id] ?? "", cells, next, depth + 1);
    return isNumeric(value) ? `(${Number(value)})` : "0";
  });

  // Only safe arithmetic may remain.
  if (!/^[\d\s+\-*/().]+$/.test(expr)) return "#ERROR";
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr});`)();
    if (typeof result !== "number" || !isFinite(result)) return "#ERROR";
    return String(Math.round(result * 1e6) / 1e6);
  } catch {
    return "#ERROR";
  }
}

export function rangeStats(range: string, cells: CellMap): RangeStats | null {
  const ids = expandRange(range);
  if (ids.length === 0) return null;
  const nums = ids
    .map((id) => evaluateCell(cells[id] ?? "", cells))
    .filter(isNumeric)
    .map(Number);
  const sum = nums.reduce((x, y) => x + y, 0);
  return {
    range: range.toUpperCase(),
    count: nums.length,
    sum,
    avg: nums.length === 0 ? 0 : sum / nums.length,
    min: nums.length === 0 ? 0 : Math.min(...nums),
    max: nums.length === 0 ? 0 : Math.max(...nums),
  };
}

/** Pleasant starter budget so the app never opens empty. */
export function demoCells(): CellMap {
  return {
    A1: "Monthly Budget",
    A3: "Income",
    A4: "Salary",
    B4: "5200",
    A5: "Freelance",
    B5: "800",
    A6: "Total income",
    B6: "=SUM(B4:B5)",
    A8: "Expenses",
    A9: "Rent",
    B9: "1750",
    A10: "Groceries",
    B10: "520",
    A11: "Transport",
    B11: "180",
    A12: "Marketing",
    B12: "400",
    A13: "Savings",
    B13: "1000",
    A14: "Total expenses",
    B14: "=SUM(B9:B13)",
    A16: "Left over",
    B16: "=B6-B14",
  };
}
