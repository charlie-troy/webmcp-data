/**
 * Co-Pilot Data Workspace — WebMCP tool catalog.
 *
 * The agent works in the same live sheet the human sees: every write flashes
 * the touched cells, and `run_what_if` evaluates scenarios without touching
 * the sheet at all. `undo_last_agent_action` keeps the human in control.
 */
import { z } from "zod";
import { registerTool, type ToolDefinition } from "./modelContext";
import { useSheet } from "../state/store";
import { expandRange, isValidCellId } from "../state/sheetModel";

const cellIdSchema = z
  .string()
  .regex(/^[A-Ha-h]([1-9]|1[0-6])$/, "Cell id like A1 … H16.");

const rangeSchema = z
  .string()
  .regex(/^[A-Ha-h]([1-9]|1[0-6])(\s*:\s*[A-Ha-h]([1-9]|1[0-6]))?$/, "Range like A1, or A1:B8.");

export async function registerAllTools(): Promise<number> {
  const defs: ToolDefinition[] = [
    {
      name: "get_sheet_state",
      description:
        "Read the whole sheet: every non-empty cell with its computed value (formulas are evaluated), plus the active chart. Call this first to understand the data.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, idempotentHint: true },
      execute: () => {
        const { cells, displayValue, chart } = useSheet.getState();
        const filled = Object.entries(cells).map(([id, raw]) => ({
          cell: id,
          value: displayValue(id),
          ...(raw.startsWith("=") ? { formula: raw } : {}),
        }));
        return {
          summary: `${filled.length} filled cells (8 columns A–H, 16 rows)${chart ? `, chart "${chart.title}" active` : ""}.`,
          dimensions: { columns: "A–H", rows: 16 },
          cells: filled,
          chart: chart ? { title: chart.title, cells: chart.cells } : null,
        };
      },
    },
    {
      name: "get_range_stats",
      description: "Compute count, sum, average, min, and max over a range's numeric values (formulas included).",
      inputSchema: z.object({ range: rangeSchema }),
      annotations: { readOnlyHint: true, idempotentHint: true },
      execute: ({ range }: { range: string }) => {
        const stats = useSheet.getState().statsFor(range);
        if (!stats) return { summary: `Invalid range "${range}".`, ok: false };
        return {
          summary: `${range.toUpperCase()}: sum ${stats.sum}, avg ${Math.round(stats.avg * 100) / 100}, min ${stats.min}, max ${stats.max} over ${stats.count} numeric cells.`,
          ...stats,
        };
      },
    },
    {
      name: "set_cells",
      description:
        "Write one or more cells in a single call. Values are raw strings; numbers as '5200', text as-is, formulas starting with '=' (e.g. '=SUM(B4:B8)'). Empty string clears a cell. The human sees every touched cell flash on screen.",
      inputSchema: z.object({
        entries: z
          .array(z.object({ cell: cellIdSchema, value: z.string().max(500) }))
          .min(1)
          .max(64),
      }),
      execute: ({ entries }: { entries: Array<{ cell: string; value: string }> }) => {
        const record: Record<string, string> = {};
        for (const e of entries) record[e.cell.toUpperCase()] = e.value;
        const count = useSheet.getState().setCells(record, "agent");
        return {
          summary: `Wrote ${count} cell${count === 1 ? "" : "s"}: ${Object.keys(record).join(", ")}.`,
          ok: true,
          cells: Object.keys(record),
        };
      },
    },
    {
      name: "apply_formula",
      description:
        "Put a formula into a cell. Supported: SUM, AVG, MIN, MAX, COUNT over ranges (e.g. '=SUM(B4:B8)'), single-cell refs (e.g. '=B6-B14'), and + - * / arithmetic.",
      inputSchema: z.object({ cell: cellIdSchema, formula: z.string().min(2).max(200).regex(/^=/, "Formula must start with '='.") }),
      execute: ({ cell, formula }: { cell: string; formula: string }) => {
        useSheet.getState().setCells({ [cell.toUpperCase()]: formula }, "agent");
        const value = useSheet.getState().displayValue(cell.toUpperCase());
        return {
          summary: `${cell.toUpperCase()} = ${formula} → ${value}${value === "#ERROR" || value === "#CYCLE" ? " (check the formula)" : ""}.`,
          ok: true,
          computed_value: value,
        };
      },
    },
    {
      name: "run_what_if",
      description:
        "Evaluate a what-if scenario WITHOUT changing the sheet: temporarily apply the given cell changes, recompute, and return stats for the requested range. Perfect for questions like 'what if we cut marketing to 200?'",
      inputSchema: z.object({
        changes: z
          .array(z.object({ cell: cellIdSchema, value: z.string().max(500) }))
          .min(1)
          .max(32)
          .describe("Hypothetical cell changes to apply temporarily."),
        stats_range: rangeSchema.describe("Range to summarize after applying the changes, e.g. 'B16' or 'B9:B13'."),
      }),
      execute: ({
        changes,
        stats_range,
      }: {
        changes: Array<{ cell: string; value: string }>;
        stats_range: string;
      }) => {
        const result = useSheet.getState().runWhatIf(
          changes.map((c) => ({ cell: c.cell.toUpperCase(), value: c.value })),
          stats_range,
        );
        if ("error" in result) return { summary: result.error, ok: false };
        const s = result.stats;
        return {
          summary: `What-if applied ${result.reverted} change(s) hypothetically: ${s.range} → sum ${s.sum}, avg ${Math.round(s.avg * 100) / 100}, min ${s.min}, max ${s.max}. The sheet was NOT modified.`,
          ok: true,
          stats: s,
        };
      },
    },
    {
      name: "generate_chart",
      description: "Point the on-screen bar chart at a range of numeric cells with a title.",
      inputSchema: z.object({
        title: z.string().min(1).max(80),
        range: rangeSchema,
      }),
      execute: ({ title, range }: { title: string; range: string }) => {
        const ok = useSheet.getState().setChart(title, range, "agent");
        return ok
          ? { summary: `Chart "${title}" now shows ${range.toUpperCase()} (${expandRange(range).length} cells).`, ok: true }
          : { summary: `Invalid range "${range}".`, ok: false };
      },
    },
    {
      name: "clear_range",
      description: "Empty every cell in a range.",
      inputSchema: z.object({ start: cellIdSchema, end: cellIdSchema.optional() }),
      annotations: { destructiveHint: true },
      execute: ({ start, end }: { start: string; end?: string }) => {
        const cleared = useSheet.getState().clearRange(start.toUpperCase(), end?.toUpperCase() ?? "", "agent");
        return { summary: `Cleared ${cleared} cell${cleared === 1 ? "" : "s"} in ${start.toUpperCase()}${end ? `:${end.toUpperCase()}` : ""}.`, ok: true, cleared };
      },
    },
    {
      name: "undo_last_agent_action",
      description: "Undo the most recent change made by an agent tool, restoring the sheet exactly as before.",
      inputSchema: z.object({}),
      annotations: { destructiveHint: true },
      execute: () => {
        const undone = useSheet.getState().undoLastAgentAction();
        return undone
          ? { summary: `Undid: ${undone.label}.`, ok: true }
          : { summary: "No agent action left to undo.", ok: false };
      },
    },
  ];

  const results = await Promise.all(defs.map((d) => registerTool(d)));
  return results.filter(Boolean).length;
}

export { isValidCellId };
