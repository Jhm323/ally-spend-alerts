import { useState } from 'react';
import SubmitTransaction from './SubmitTransaction';
import AlertHistory from './AlertHistory';

type View = 'submit' | 'history';

export default function App() {
  const [view, setView] = useState<View>('submit');

  return (
    <div className="app">
      <nav>
        <span className="app-title">Ally Spend Alerts</span>
        <div className="nav-links">
          <button
            className={view === 'submit' ? 'active' : ''}
            onClick={() => setView('submit')}
          >
            Submit Transaction
          </button>
          <button
            className={view === 'history' ? 'active' : ''}
            onClick={() => setView('history')}
          >
            Alert History
          </button>
        </div>
      </nav>
      <main>
        {view === 'submit' ? <SubmitTransaction /> : <AlertHistory />}
      </main>
    </div>
  );
}
