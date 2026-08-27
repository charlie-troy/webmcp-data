# Devpost Submission Draft — Co-Pilot Data Workspace

> Copy/paste into the WebMCP Challenge submission form. Replace the `[PLACEHOLDER]`
> links after deploying and uploading the video. (The full write-up also lives in
> this repo's README.)

## Project title
**Co-Pilot Data Workspace** — human and agent, same sheet

## Tagline (one line)
A spreadsheet where the agent works in the same live sheet you're looking at — every write flashes on screen, what-if scenarios touch nothing, and one call undoes it all.

## Elevator pitch (short description)
Co-Pilot is a spreadsheet built around WebMCP's **state-sharing** pillar: the agent reads and writes the **same live grid** the human sees, with typed tools and evaluated feedback. `get_sheet_state` / `get_range_stats` read computed values (formulas evaluated, not scraped); `set_cells` batch-writes with every touched cell flashing teal on screen; `apply_formula` returns the computed result immediately so the agent verifies its own work; **`run_what_if` evaluates scenarios hypothetically without modifying the sheet**; and `undo_last_agent_action` restores the sheet exactly. Demo sheet: monthly budget (Income 6,000, Expenses 3,850, Left over 2,150) with a live Expenses bar chart.

## Why WebMCP (the before/after)
Spreadsheets are the web's most stateful interface. A scraping agent guessing at cells is slow — and dangerous: one mistyped coordinate silently overwrites real data. WebMCP replaces that with typed tools and live feedback, and makes **bidirectional co-editing** possible: the human watches every change land, questions it, and undoes it mid-flow.

**What became possible that wasn't before:** `run_what_if` — the agent answers "what if marketing drops to 200?" by recomputing totals *hypothetically* and returning the new numbers, leaving the sheet untouched until the human decides.

## Judging fit

- **WebMCP Leverage:** the tools expose evaluated spreadsheet state rather than pixel scraping; `run_what_if` is explicitly read-only, while writes return computed values and visible cell feedback.
- **Execution:** the seeded budget, live chart, formula evaluator, bounded schemas, formula-error reporting, and undo path make the entire demo inspectable in one session.
- **Potential Impact:** people can ask questions, test decisions, and commit changes without losing trust in the sheet or needing to translate intent into coordinates.
- **Creativity & Ambition:** the key interaction is a reversible decision loop — ask, simulate, explain, then apply — turning a spreadsheet into a human-agent workspace.

## How it works / demo flow
1. Open the site in ChatGPT's desktop browser (or Chrome with the WebMCP flag).
2. *"What's my leftover each month?"* → `get_range_stats` → **B16 = 2,150**.
3. *"What if marketing drops to 200?"* → `run_what_if` returns new totals, sheet untouched.
4. *"Add a 'Subscriptions' expense of 120 in row 15 and include it in the total."* → `set_cells` (flash!) + `apply_formula` (returns computed value).
5. *"Undo the last change."* → `undo_last_agent_action`.

## Tools
`get_sheet_state` · `get_range_stats` · `set_cells` · `apply_formula` · `run_what_if` · `generate_chart` · `clear_range` ⚠ · `undo_last_agent_action` ⚠

(⚠ = annotated `destructiveHint`.)

## Tech stack
Vite + React + TypeScript · Zustand (state) · safe formula evaluator (SUM/AVG/MIN/MAX/COUNT, cell refs, arithmetic — no `eval` of arbitrary input) · Zod → JSON Schema (tool schemas) · official `@mcp-b/webmcp-polyfill` fallback · `document.modelContext` / `navigator.modelContext` feature detection

## Links
- **GitHub:** https://github.com/charlie-troy/webmcp-data
- **Live demo:** https://webmcp-data.vercel.app
- **Video:** [YOUTUBE_URL_PLACEHOLDER] (script: `docs/VIDEO_SCRIPT.md`)

## Team
Charlie Troy — solo

## Tags
webmcp, ai-agents, spreadsheet, data, what-if-analysis, productivity

## License
MIT (in-repo)
