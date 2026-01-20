import { useEffect, useState } from "react";
import { DemandForecastingWidget } from "./widgets/DemandForecastingWidget";

type IncomingData = any;

// Optional: provide any host-related context you need
const hostData = { source: "local-demo" };

function App() {
  const [incomingData, setIncomingData] = useState<IncomingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        setError(null);
        const res = await fetch("../src/json/incoming-data.json", {
          signal: controller.signal,
          cache: "no-store"
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setIncomingData(json);
      } catch (e: any) {
        if (!cancelled && e.name !== "AbortError") {
          setError(e?.message ?? "Failed to load data");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  if (error) {
    return <div className="min-h-screen p-4 text-red-600">Failed to load data: {error}</div>;
  }

  if (!incomingData) {
    return <div className="min-h-screen p-4">Loading data…</div>;
  }

  return (
    <div className="min-h-screen">
      <DemandForecastingWidget incomingData={incomingData} hostData={hostData} />
    </div>
  );
}

export default App;