# 📊 Co-Pilot Data Workspace

An agent-native spreadsheet built on **WebMCP**, showcasing the standard's *state
sharing* pillar: the agent works **in the same live sheet** the human is looking at.
Every agent write flashes the touched cells teal, `run_what_if` evaluates scenarios
without modifying anything, and `undo_last_agent_action` keeps the human in charge.

Built for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/).

## Why WebMCP fits this app

Spreadsheets are the web's most stateful interface. A scraping agent editing a grid is
slow and dangerous; a WebMCP agent gets typed tools with evaluated feedback
(`apply_formula` returns the computed result immediately), and the human sees every
change land in real time. What was impossible before: **bidirectional co-editing where
the human watches, questions, and undoes the agent mid-flow.**

## Tools

| Tool | Kind | Description |
|---|---|---|
| `get_sheet_state` | read | All filled cells with computed values + active chart |
| `get_range_stats` | read | count / sum / avg / min / max for a range |
| `set_cells` | action | Batch-write up to 64 cells; touched cells flash on screen |
| `apply_formula` | action | `=SUM(B4:B8)`, cell refs, arithmetic — returns computed value |
| `run_what_if` | read-only effect | Hypothetically apply changes, return recomputed stats, revert |
| `generate_chart` | action | Point the on-screen bar chart at a range |
| `clear_range` ⚠ | destructive | Empty a range |
| `undo_last_agent_action` ⚠ | destructive | Revert the last agent change |

## Try it with an agent

Open the deployed site in ChatGPT's desktop browser (GPT-5.6 Sol/Terra) or Chrome with
`chrome://flags/#enable-webmcp-testing` enabled, then ask:

> *"What's my leftover each month?"*
> *"What if marketing dropped to 200 — what's the new leftover?"* (uses `run_what_if`)
> *"Add a 'Subscriptions' expense of 120 and chart the expenses."*

## Architecture

- `src/state/sheetModel.ts` — cell/range parsing and a small, safe formula evaluator
  (SUM/AVG/MIN/MAX/COUNT, cell refs, arithmetic — no `eval` of arbitrary input).
- `src/state/store.ts` — Zustand store; snapshot history powers undo; `agentTouched`
  timestamps drive the flash animation.
- `src/webmcp/` — feature detection + official polyfill fallback + logging wrapper;
  Zod schemas compiled to JSON Schema.

## Run locally

```bash
npm install
npm run dev
```

## License

MIT
