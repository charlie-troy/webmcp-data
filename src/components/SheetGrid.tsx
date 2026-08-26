import { useSheet } from "../state/store";
import { COLUMN_LETTERS, NUM_COLS, NUM_ROWS } from "../state/sheetModel";

export function SheetGrid() {
  const cells = useSheet((s) => s.cells);
  const agentTouched = useSheet((s) => s.agentTouched);
  const displayValue = useSheet((s) => s.displayValue);
  const setCells = useSheet((s) => s.setCells);

  const onEdit = (id: string, raw: string) => {
    setCells({ [id]: raw }, "human");
  };

  return (
    <section className="grid-panel" aria-label="Spreadsheet">
      <div className="grid-scroll">
        <table className="sheet">
          <thead>
            <tr>
              <th className="corner" aria-hidden="true" />
              {COLUMN_LETTERS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: NUM_ROWS }, (_, row) => (
              <tr key={row}>
                <th scope="row">{row + 1}</th>
                {Array.from({ length: NUM_COLS }, (_, col) => {
                  const id = `${COLUMN_LETTERS[col]}${row + 1}`;
                  const raw = cells[id] ?? "";
                  const value = displayValue(id);
                  const touched = agentTouched[id];
                  const recentlyTouched = touched != null && Date.now() - touched < 4000;
                  return (
                    <td key={id} className={recentlyTouched ? "agent-flash" : ""}>
                      <input
                        aria-label={`Cell ${id}`}
                        className={raw.startsWith("=") ? "formula" : ""}
                        value={raw}
                        placeholder=""
                        onChange={(e) => onEdit(id, e.target.value)}
                        title={raw.startsWith("=") ? `${id}: formula ${raw} = ${value}` : undefined}
                      />
                      {raw.startsWith("=") && <span className="computed">{value}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="grid-hint">
        Type raw values or formulas (<code>=SUM(B4:B5)</code>, <code>=B6-B14</code>). Cells the agent
        writes flash teal.
      </p>
    </section>
  );
}
