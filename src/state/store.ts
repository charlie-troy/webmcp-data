import { create } from "zustand";
import {
  demoCells,
  evaluateCell,
  expandRange,
  isValidCellId,
  rangeStats,
  type RangeStats,
} from "./sheetModel";

export type Source = "human" | "agent";

export interface ChartState {
  title: string;
  /** Cell ids feeding the chart, in order. */
  cells: string[];
}

interface Snapshot {
  cells: Record<string, string>;
  chart: ChartState | null;
}

interface HistoryEntry {
  snapshot: Snapshot;
  source: Source;
  label: string;
}

interface SheetState {
  cells: Record<string, string>;
  /** cellId → timestamp of the last agent write, used for the flash animation. */
  agentTouched: Record<string, number>;
  chart: ChartState | null;
  history: HistoryEntry[];

  displayValue: (cellId: string) => string;

  setCells: (entries: Record<string, string>, source?: Source) => number;
  clearRange: (start: string, end: string, source?: Source) => number;
  setChart: (title: string, range: string, source?: Source) => boolean;
  clearChart: (source?: Source) => void;
  runWhatIf: (
    changes: Array<{ cell: string; value: string }>,
    statsRange: string,
  ) => { stats: RangeStats; reverted: number } | { error: string };
  statsFor: (range: string) => RangeStats | null;
  undoLastAgentAction: () => { label: string } | null;
  loadDemo: () => void;
}

export const useSheet = create<SheetState>((set, get) => {
  function mutate(source: Source, label: string, fn: (draft: Snapshot) => void) {
    set((s) => {
      const before: Snapshot = { cells: { ...s.cells }, chart: s.chart };
      const draft: Snapshot = { cells: { ...s.cells }, chart: s.chart };
      fn(draft);
      return {
        cells: draft.cells,
        chart: draft.chart,
        history: [...s.history, { snapshot: before, source, label }].slice(-100),
      };
    });
  }

  return {
    cells: {},
    agentTouched: {},
    chart: null,
    history: [],

    displayValue: (cellId) => {
      const raw = get().cells[cellId];
      if (raw == null) return "";
      return evaluateCell(raw, get().cells, new Set(), 0, cellId);
    },

    setCells: (entries, source = "human") => {
      let count = 0;
      mutate(source, `set_cells(${Object.keys(entries).join(", ")})`, (draft) => {
        for (const [id, value] of Object.entries(entries)) {
          if (!isValidCellId(id)) continue;
          if (value === "") delete draft.cells[id];
          else draft.cells[id] = value;
          count++;
        }
      });
      if (source === "agent" && count > 0) {
        const touched = { ...get().agentTouched };
        const now = Date.now();
        for (const id of Object.keys(entries)) touched[id] = now;
        set({ agentTouched: touched });
      }
      return count;
    },

    clearRange: (start, end, source = "human") => {
      const ids = expandRange(end ? `${start}:${end}` : start);
      let cleared = 0;
      mutate(source, `clear_range(${start}${end ? `:${end}` : ""})`, (draft) => {
        for (const id of ids) {
          if (id in draft.cells) {
            delete draft.cells[id];
            cleared++;
          }
        }
      });
      return cleared;
    },

    setChart: (title, range, source = "human") => {
      const ids = expandRange(range);
      if (ids.length === 0) return false;
      mutate(source, `generate_chart("${title}")`, (draft) => {
        draft.chart = { title, cells: ids };
      });
      return true;
    },

    clearChart: (source = "human") =>
      mutate(source, "clear_chart()", (draft) => {
        draft.chart = null;
      }),

    runWhatIf: (changes, statsRange) => {
      for (const change of changes) {
        if (!isValidCellId(change.cell)) return { error: `Invalid cell id: ${change.cell}` };
      }
      const ids = expandRange(statsRange);
      if (ids.length === 0) return { error: `Invalid range: ${statsRange}` };

      const { cells } = get();
      const hypothetical: Record<string, string> = { ...cells };
      for (const change of changes) {
        if (change.value === "") delete hypothetical[change.cell];
        else hypothetical[change.cell] = change.value;
      }
      const stats = rangeStats(statsRange, hypothetical);
      if (!stats) return { error: `Invalid range: ${statsRange}` };
      return { stats, reverted: changes.length };
    },

    statsFor: (range) => rangeStats(range, get().cells),

    undoLastAgentAction: () => {
      const { history } = get();
      for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i];
        if (entry.source !== "agent") continue;
        set({
          cells: entry.snapshot.cells,
          chart: entry.snapshot.chart,
          history: history.slice(0, i),
          agentTouched: {},
        });
        return { label: entry.label };
      }
      return null;
    },

    loadDemo: () =>
      set({ cells: demoCells(), chart: { title: "Expenses", cells: ["B9", "B10", "B11", "B12", "B13"] }, agentTouched: {} }),
  };
});
