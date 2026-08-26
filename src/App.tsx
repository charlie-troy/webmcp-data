import { useEffect } from "react";
import { SheetGrid } from "./components/SheetGrid";
import { ChartPanel } from "./components/ChartPanel";
import { ActivityPanel } from "./components/ActivityPanel";
import { initWebMCP, getWebMCPStatus } from "./webmcp/modelContext";
import { useWebMCPStatus } from "./webmcp/statusStore";
import { registerAllTools } from "./webmcp/tools";
import { useSheet } from "./state/store";

function McpBadge() {
  const mode = useWebMCPStatus((s) => s.mode);
  return (
    <div className={`mcp-badge ${mode}`} role="status">
      {mode === "native" && "● WebMCP native"}
      {mode === "polyfill" && "● WebMCP polyfill"}
      {mode === "unavailable" && "○ WebMCP unavailable"}
      {mode === "checking" && "○ WebMCP…"}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (Object.keys(useSheet.getState().cells).length === 0) {
        useSheet.getState().loadDemo();
      }
      try {
        await initWebMCP();
        if (!cancelled && getWebMCPStatus().mode !== "unavailable") {
          await registerAllTools();
        }
      } catch (err) {
        console.error("[webmcp] init failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">📊 Co-Pilot Data Workspace</div>
        <div className="header-stats">The agent works in the same live sheet — every write flashes</div>
        <McpBadge />
      </header>
      <div className="workspace">
        <SheetGrid />
        <div className="right-rail">
          <ChartPanel />
          <ActivityPanel />
        </div>
      </div>
    </div>
  );
}
