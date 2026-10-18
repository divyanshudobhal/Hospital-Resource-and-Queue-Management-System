
import { useState } from 'react';

const API = 'http://localhost:5000/api/os-scheduling';

const initialProcesses = [
  { arrival: 0, burst: 6, priority: 3 },
  { arrival: 1, burst: 2, priority: 1 },
  { arrival: 2, burst: 1, priority: 2 },
];

export default function CSchedulingRunner() {
  const [algorithm, setAlgorithm] = useState('fcfs');
  const [processes, setProcesses] = useState(initialProcesses);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateProcess(index, field, value) {
    setProcesses((current) =>
      current.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    );
  }

  function addProcess() {
    if (processes.length >= 100) return;

    setProcesses((current) => [
      ...current,
      { arrival: 0, burst: 1, priority: 2 },
    ]);
    setResult(null);
  }

  function removeProcess(index) {
    setProcesses((current) => current.filter((_, i) => i !== index));
    setResult(null);
  }

  async function runSimulation() {
    setLoading(true);
    setError('');
    setResult(null);

    const payload = {
      processes: processes.map((p) => ({
        arrival: Number(p.arrival),
        burst: Number(p.burst),
        ...(algorithm === 'priority'
          ? { priority: Number(p.priority) }
          : {}),
      })),
    };

    try {
      const response = await fetch(`${API}/${algorithm}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        These simulations execute the compiled C programs through the
        Node.js backend.
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
      </select>

      <h3>Process inputs</h3>
      <p>
        Lower priority numbers mean higher priority. Arrival and burst times
        must be whole numbers; burst time must be greater than zero.
      </p>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Process</th>
              <th>Arrival</th>
              <th>Burst</th>
              {algorithm === 'priority' && <th>Priority</th>}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p, index) => (
              <tr key={index}>
                <td>P{index + 1}</td>
                <td>
                  <input
                    aria-label={`P${index + 1} arrival time`}
                    type="number"
                    min="0"
                    step="1"
                    value={p.arrival}
                    onChange={(e) =>
                      updateProcess(index, 'arrival', e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    aria-label={`P${index + 1} burst time`}
                    type="number"
                    min="1"
                    step="1"
                    value={p.burst}
                    onChange={(e) =>
                      updateProcess(index, 'burst', e.target.value)
                    }
                  />
                </td>
                {algorithm === 'priority' && (
                  <td>
                    <input
                      aria-label={`P${index + 1} priority`}
                      type="number"
                      min="0"
                      step="1"
                      value={p.priority}
                      onChange={(e) =>
                        updateProcess(index, 'priority', e.target.value)
                      }
                    />
                  </td>
                )}
                <td>
                  <button
                    type="button"
                    onClick={() => removeProcess(index)}
                    disabled={processes.length === 1}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button
          type="button"
          onClick={addProcess}
          disabled={processes.length >= 100}
        >
          + Add Process
        </button>

        <button
          type="button"
          onClick={runSimulation}
          disabled={loading || processes.length === 0}
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
