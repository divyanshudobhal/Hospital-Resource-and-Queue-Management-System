
import { useState } from 'react';

const API = '/api/os-scheduling';

export default function CSchedulingRunner({ appointments = [] }) {
  const [algorithm, setAlgorithm] = useState('fcfs');
  const [quantum, setQuantum] = useState(2);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const waitingCount = appointments.filter((appointment) => appointment.status === 'waiting').length;

  async function runSimulation() {
    setLoading(true);
    setError('');
    setResult(null);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API}/${algorithm}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(algorithm === 'round-robin' ? { quantum: Number(quantum) } : {}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scheduling request failed.');
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message ||
          'Could not connect to the backend. Check that Node.js is running.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card c-scheduling-runner">
      <h2>C-Based CPU Scheduling</h2>
      <p>
        Each run loads your current waiting appointments from the database and
        executes the selected C scheduler through the backend.
      </p>

      <label htmlFor="c-algorithm">Scheduling algorithm</label>
      <select
        id="c-algorithm"
        value={algorithm}
        onChange={(e) => {
          setAlgorithm(e.target.value);
          setResult(null);
          setError('');
        }}
      >
        <option value="fcfs">FCFS</option>
        <option value="priority">Non-preemptive Priority</option>
        <option value="sjf">Non-preemptive SJF</option>
        <option value="round-robin">Round Robin</option>
        <option value="multilevel">Multilevel Queue</option>
      </select>

      <p>{waitingCount} waiting appointment{waitingCount === 1 ? '' : 's'} loaded for this doctor.</p>
      {algorithm === 'round-robin' && (
        <label htmlFor="round-robin-quantum">
          Time quantum
          <input
            id="round-robin-quantum"
            type="number"
            min="1"
            max="1000000"
            step="1"
            value={quantum}
            onChange={(event) => setQuantum(event.target.value)}
          />
        </label>
      )}

      <div style={{ marginTop: '16px' }}>
        <button
          type="button"
          onClick={runSimulation}
          disabled={loading}
        >
          {loading ? 'Running C program...' : 'Run C Simulation'}
        </button>
      </div>

      {error && (
        <p role="alert" style={{ color: '#dc2626', marginTop: '16px' }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>{result.algorithm} — Results</h3>
          <pre
            style={{
              padding: '16px',
              borderRadius: '8px',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              background: '#111827',
              color: '#e5e7eb',
            }}
          >
            {result.output}
          </pre>
        </div>
      )}
    </section>
  );
}
