# 📊 Co-Pilot Data Workspace — Demo Video Script (<3 min)

**Target length:** 2:30–2:45 · **Format:** 1080p, browser maximized, screen + voiceover.
Captions on. Record each section in one continuous take; the cut points are the only edits.

## Arc at a glance

| Time | Section | Goal |
|---|---|---|
| 0:00–0:15 | Hook | State sharing: agent works in the same live sheet |
| 0:15–0:40 | The problem | Scraping agents and spreadsheets don't mix |
| 0:40–1:50 | The magic | Read · write · what-if (the showstopper) |
| 1:50–2:25 | Co-use | Flash feedback, human edits, agent undo |
| 2:25–2:45 | Close | Sheet as collaboration, not document |

---

## Shot-by-shot

### 0:00–0:15 — Hook
**Visual:** Demo budget sheet (Income 5,200 + 800 = 6,000; Expenses 1,750/520/180/400/1,000; Left over 2,150) with the **Expenses** bar chart rendered.
**VO:** "This is a spreadsheet where the agent works in the same live sheet you're looking at. Same cells, same formulas, same chart. That's WebMCP's state-sharing pillar, in the flesh."

### 0:15–0:40 — The problem
**Visual:** Quick clip of an agent *without* WebMCP poking at a grid — hovering, mistyping coordinates, misreading cells. ~10s, then cut.
**VO:** "Spreadsheets are the most stateful interface on the web. A scraping agent guessing at cells is slow — and dangerous: one mistyped coordinate overwrites real data, silently. WebMCP fixes both with typed tools and live feedback."

### 0:40–1:50 — The magic
**Visual:** ChatGPT desktop (or flagged Chrome), site open. Type prompts; watch cell flashes and the chart.
**Prompt 1:** `What's my leftover each month?`
**Tool calls:** `get_sheet_state` / `get_range_stats` → answers **B16 = 2,150**.
**VO:** "It reads the evaluated sheet — formulas computed, not scraped. Leftover: 2,150."
**Prompt 2:** `What if marketing drops to 200?`
**Tool call:** `run_what_if` (hypothetically sets B12=200, recomputes totals, returns stats, reverts).
**VO:** "Here's the one that was impossible before: 'What if marketing drops to 200?' The agent runs the scenario hypothetically — recomputes the totals, returns the new leftover, and the sheet is untouched. You decide before anything changes."
**Prompt 3:** `Add a "Subscriptions" expense of 120 in row 15 and include it in the total.`
**Tool calls:** `set_cells` (A15="Subscriptions", B15=120) → `apply_formula` (B14 `=SUM(B9:B15)`, returns the computed value). Cells flash teal on write.
**VO:** "'Add a Subscriptions expense of 120 in row 15 and include it in the total.' Watch the cells flash — every write is visible. And when the formula updates, the tool returns the computed result immediately, so the agent verifies its own work."

### 1:50–2:25 — Co-use
**Visual:** Human clicks a cell and edits a value by hand (show a cell in edit mode), then types `Undo the last change.`
**Tool call:** `undo_last_agent_action`.
**VO:** "The human edits right alongside — click any cell. And nothing the agent does is beyond reach: one call undoes the last agent action, restoring the sheet exactly."

### 2:25–2:45 — Close
**Visual:** Full sheet + chart, activity log full.
**VO:** "WebMCP turns the spreadsheet from a document into a collaboration. Human and agent, same cells, full visibility, full undo. Try it — repo and live link below."
**End card:** Title · "Built with WebMCP" · GitHub repo · live URL.

---

## Recording checklist
- [ ] Header badge reads **"WebMCP active"** (native). If "polyfill", enable `chrome://flags/#enable-webmcp-testing` or use ChatGPT desktop.
- [ ] Browser window 1600×900+, no stray tabs.
- [ ] Voiceover clean; no background music under VO.
- [ ] Stumble? Pause 1 second, restart the sentence — cut later.
- [ ] Total runtime ≤ 2:45. Fix auto-captions on tool names after upload.
