import { useSheet } from "../state/store";

export function ChartPanel() {
  const chart = useSheet((s) => s.chart);
  const displayValue = useSheet((s) => s.displayValue);

  if (!chart) {
    return (
      <aside className="chart-panel" aria-label="Chart">
        <div className="panel-title">Chart</div>
        <div className="chart-empty">No chart yet — ask the agent to generate one from a range.</div>
      </aside>
    );
  }

  const points = chart.cells
    .map((id) => {
      const value = Number(displayValue(id));
      return { id, value: isNaN(value) ? 0 : value };
    })
    .filter((p) => p.value !== 0 || chart!.cells.length <= 8);

  const max = Math.max(...points.map((p) => Math.abs(p.value)), 1);

  return (
    <aside className="chart-panel" aria-label={`Bar chart: ${chart.title}`}>
      <div className="panel-title">{chart.title}</div>
      <div className="chart-body">
        {points.map((p) => (
          <div className="bar-row" key={p.id}>
            <span className="bar-label">{p.id}</span>
            <div className="bar-track">
              <div
                className="bar"
                style={{ transform: `scaleX(${Math.min(1, Math.abs(p.value) / max)})` }}
                title={`${p.id}: ${p.value}`}
              />
            </div>
            <span className="bar-value">{Math.round(p.value * 100) / 100}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
