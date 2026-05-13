import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL as string;

interface AlertRecord {
  alertId: string;
  category: string;
  amount: number;
  threshold: number;
  timestamp: string;
}

export default function AlertHistory() {
  const [userId, setUserId] = useState('');
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  async function fetchAlerts() {
    setLoading(true);
    setError(null);
    setFetched(false);

    try {
      const res = await fetch(
        `${API_URL}/alerts?userId=${encodeURIComponent(userId)}`
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      setAlerts(await res.json() as AlertRecord[]);
      setFetched(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="view">
      <h2>Alert History</h2>
      <div className="fetch-row">
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button type="button" onClick={fetchAlerts} disabled={loading || !userId}>
          {loading ? 'Fetching…' : 'Fetch'}
        </button>
      </div>
      {error && <p className="status error">{error}</p>}
      {fetched && alerts.length === 0 && <p className="empty">No alerts found.</p>}
      {alerts.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Threshold</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.alertId}>
                <td>{a.alertId}</td>
                <td>{a.category}</td>
                <td>${a.amount.toFixed(2)}</td>
                <td>${a.threshold.toFixed(2)}</td>
                <td>{new Date(a.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
