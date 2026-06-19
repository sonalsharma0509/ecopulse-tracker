import { CarbonForm } from "./components/Calculator/CarbonForm";
import { FootprintReport } from "./components/Calculator/FootprintReport";
import { AdvicePanel } from "./components/Insights/AdvicePanel";
import { ProgressHistory } from "./components/History/ProgressHistory";
import { useEmissionTracker } from "./hooks/useEmissionTracker";

export default function App() {
  const { result, insights, entries, loading, saving, error, status, calculate, save } =
    useEmissionTracker();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="app-header">
        <h1>EcoPulse</h1>
        <p>Track, understand, and reduce your carbon footprint.</p>
      </header>

      <main id="main">
        <CarbonForm onSubmit={calculate} loading={loading} />

        <div role="alert" aria-live="assertive">
          {error && <p className="error">{error}</p>}
        </div>
        <p role="status" className="visually-hidden">
          {status}
        </p>

        {result && (
          <>
            <FootprintReport result={result} />
            {insights && <AdvicePanel insights={insights} />}
            <div className="card">
              <button className="btn secondary" onClick={save} disabled={saving} aria-busy={saving}>
                {saving ? "Saving…" : "Save this entry to my history"}
              </button>
            </div>
          </>
        )}

        <ProgressHistory entries={entries} />
      </main>
    </>
  );
}
