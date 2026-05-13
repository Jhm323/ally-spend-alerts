import { useState, FormEvent } from 'react';

const API_URL = import.meta.env.VITE_API_URL as string;

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Entertainment', 'Other'] as const;
type Category = (typeof CATEGORIES)[number];

interface SubmitResult {
  evaluated: boolean;
  alertsFired: number;
}

export default function SubmitTransaction() {
  const [userId, setUserId] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`${API_URL}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          userId,
          accountId: userId,
          amount: parseFloat(amount),
          merchantName: merchant,
          merchantCategory: category,
          type: 'debit',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as SubmitResult;
      const n = data.alertsFired;
      setStatus({
        type: 'success',
        message: `Transaction evaluated. ${n} alert${n === 1 ? '' : 's'} fired.`,
      });
    } catch (err) {
      setStatus({ type: 'error', message: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="view">
      <h2>Submit Transaction</h2>
      <form onSubmit={handleSubmit}>
        <label>
          User ID
          <input
            required
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </label>
        <label>
          Merchant
          <input
            required
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
        </label>
        <label>
          Amount
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit'}
        </button>
      </form>
      {status && <p className={`status ${status.type}`}>{status.message}</p>}
    </div>
  );
}
