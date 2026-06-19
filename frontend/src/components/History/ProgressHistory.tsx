import type { Entry } from "../../lib/types";
import { formatDate, formatTonnes } from "../../lib/format";

interface Props {
  entries: Entry[];
}

export function ProgressHistory({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <section className="card" aria-labelledby="history-heading">
        <h2 id="history-heading">Your history</h2>
        <p>No saved entries yet. Calculate and save a footprint to start tracking your progress.</p>
      </section>
    );
  }

  const latest = entries[0].result.total_annual_tonnes;
  const previous = entries.length > 1 ? entries[1].result.total_annual_tonnes : null;
  const trend = previous === null ? null : latest - previous;

  const allTonnes = entries.map((e) => e.result.total_annual_tonnes);
  const avg = allTonnes.reduce((a, b) => a + b, 0) / allTonnes.length;
  const min = Math.min(...allTonnes);
  const max = Math.max(...allTonnes);

  return (
    <section className="card" aria-labelledby="history-heading">
      <h2 id="history-heading">Your history</h2>

      {trend !== null && (
        <p aria-live="polite">
          {trend < 0 ? (
            <span className="under">
              ▼ Down {formatTonnes(Math.abs(trend))} since your last entry.
            </span>
          ) : trend > 0 ? (
            <span className="over">▲ Up {formatTonnes(trend)} since your last entry.</span>
          ) : (
            <span>No change since your last entry.</span>
          )}
        </p>
      )}

      <div className="stats-row" aria-label="Footprint statistics">
        <span className="stat"><strong>Average:</strong> {formatTonnes(avg)} t</span>
        <span className="stat"><strong>Min:</strong> {formatTonnes(min)} t</span>
        <span className="stat"><strong>Max:</strong> {formatTonnes(max)} t</span>
      </div>

      <table className="history">
        <caption className="visually-hidden">Saved footprint entries, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Total (t CO₂e / year)</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <th scope="row">{formatDate(e.created_at)}</th>
              <td>{formatTonnes(e.result.total_annual_tonnes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
