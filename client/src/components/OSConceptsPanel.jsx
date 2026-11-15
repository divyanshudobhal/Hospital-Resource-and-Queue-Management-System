import { useState } from 'react';

const bankerInput = {
  available: [3, 3, 2],
  allocation: [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]],
  maximum: [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]]
};

const resourceInput = {
  capacity: { generalBeds: 2, icuBeds: 1, ventilators: 1 },
  operations: [
    { process: 'P1', action: 'request', resources: { generalBeds: 1, icuBeds: 1, ventilators: 0 } },
    { process: 'P2', action: 'request', resources: { generalBeds: 0, icuBeds: 1, ventilators: 0 } },
    { process: 'P1', action: 'release', resources: { generalBeds: 1, icuBeds: 1, ventilators: 0 } },
    { process: 'P2', action: 'request', resources: { generalBeds: 0, icuBeds: 1, ventilators: 0 } }
  ]
};

const synchronizationProcesses = [
  { id: 'P1', arrival: 0, duration: 3 },
  { id: 'P2', arrival: 1, duration: 2 },
  { id: 'P3', arrival: 2, duration: 1 }
];

export default function OSConceptsPanel() {
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [running, setRunning] = useState('');
  const [mode, setMode] = useState('mutex');
  const token = localStorage.getItem('token');

  async function runSimulation(name, endpoint, input) {
    setRunning(name);
    setErrors(current => ({ ...current, [name]: '' }));
    try {
      const response = await fetch(`/api/os-concepts/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(input)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Simulation failed.');
      setResults(current => ({ ...current, [name]: data }));
    } catch (error) {
      setErrors(current => ({ ...current, [name]: error.message }));
    } finally {
      setRunning('');
    }
  }

  function resultOutput(name) {
    if (errors[name]) return <p role="alert" className="alert alert-error">{errors[name]}</p>;
    if (!results[name]) return null;
    return <pre className="simulation-output">{JSON.stringify(results[name], null, 2)}</pre>;
  }

  return (
    <section className="card">
      <h2>Resource allocation and synchronization</h2>
      <p>Run the sample operating-system scenarios and inspect each allocation or safe sequence.</p>

      <article className="simulation-demo">
        <h3>Resource allocation</h3>
        <p>Requests that exceed available beds or ventilators are denied. Releases return resources to the pool.</p>
        <button type="button" className="btn btn-primary" disabled={Boolean(running)} onClick={() => runSimulation('resources', 'resources', resourceInput)}>
          {running === 'resources' ? 'Running…' : 'Run resource allocation'}
        </button>
        {resultOutput('resources')}
      </article>

      <article className="simulation-demo">
        <h3>Deadlock avoidance — Banker’s algorithm</h3>
        <p>Checks whether all processes can complete in a safe sequence with the available resource vector.</p>
        <button type="button" className="btn btn-primary" disabled={Boolean(running)} onClick={() => runSimulation('deadlock', 'deadlock', bankerInput)}>
          {running === 'deadlock' ? 'Running…' : 'Check safe sequence'}
        </button>
        {resultOutput('deadlock')}
      </article>

      <article className="simulation-demo">
        <h3>Process synchronization</h3>
        <p>A mutex permits one process into the critical section; a semaphore permits the selected number of processes.</p>
        <label htmlFor="sync-mode">Synchronization method</label>
        <select id="sync-mode" value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="mutex">Mutex (1 permit)</option>
          <option value="semaphore">Semaphore (2 permits)</option>
        </select>
        <button
          type="button"
          className="btn btn-primary"
          disabled={Boolean(running)}
          onClick={() => runSimulation('synchronization', 'synchronization', {
            mode,
            permits: mode === 'mutex' ? 1 : 2,
            processes: synchronizationProcesses
          })}
        >
          {running === 'synchronization' ? 'Running…' : 'Run synchronization'}
        </button>
        {resultOutput('synchronization')}
      </article>
    </section>
  );
}
