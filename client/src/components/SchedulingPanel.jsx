import { useState, useEffect } from 'react';

/* ===== SCHEDULING ALGORITHMS ===== */

// FCFS — First Come First Serve
function fcfsScheduling(patients) {
  const sorted = [...patients].sort((a, b) => a.arrivalTime - b.arrivalTime);
  const schedule = [];
  let currentTime = sorted.length > 0 ? sorted[0].arrivalTime : 0;

  for (const patient of sorted) {
    // Idle gap if no patient has arrived yet
    if (currentTime < patient.arrivalTime) {
      schedule.push({ type: 'idle', start: currentTime, end: patient.arrivalTime });
      currentTime = patient.arrivalTime;
    }

    const start = currentTime;
    const end = start + patient.serviceTime;
    schedule.push({
      ...patient,
      type: 'process',
      start,
      end,
      waitingTime: start - patient.arrivalTime,
      turnaroundTime: end - patient.arrivalTime
    });
    currentTime = end;
  }
  return schedule;
}

// Non-preemptive Priority Scheduling
function priorityScheduling(patients) {
  const remaining = patients.map((p) => ({ ...p }));
  const schedule = [];
  let currentTime = remaining.length > 0 ? Math.min(...remaining.map((p) => p.arrivalTime)) : 0;

  while (remaining.length > 0) {
    const available = remaining.filter((p) => p.arrivalTime <= currentTime);

    if (available.length === 0) {
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
      schedule.push({ type: 'idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    // Sort: lower priority number first, then earlier arrival
    available.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.arrivalTime - b.arrivalTime;
    });

    const selected = available[0];
    const idx = remaining.findIndex((p) => p.id === selected.id);
    remaining.splice(idx, 1);

    const start = currentTime;
    const end = start + selected.serviceTime;
    schedule.push({
      ...selected,
      type: 'process',
      start,
      end,
      waitingTime: start - selected.arrivalTime,
      turnaroundTime: end - selected.arrivalTime
    });
    currentTime = end;
  }
  return schedule;
}

/* ===== SAMPLE DATA ===== */
const SAMPLE_PATIENTS = [
  { id: 'P1', name: 'Alice Johnson', arrivalTime: 0,  serviceTime: 20, priority: 2, appointmentType: 'regular' },
  { id: 'P2', name: 'Bob Williams',  arrivalTime: 5,  serviceTime: 15, priority: 1, appointmentType: 'emergency' },
  { id: 'P3', name: 'Charlie Brown', arrivalTime: 10, serviceTime: 25, priority: 2, appointmentType: 'regular' },
  { id: 'P4', name: 'Diana Ross',    arrivalTime: 12, serviceTime: 10, priority: 1, appointmentType: 'emergency' },
  { id: 'P5', name: 'Eve Davis',     arrivalTime: 20, serviceTime: 15, priority: 2, appointmentType: 'regular' },
];

/* ===== GANTT CHART ===== */
function GanttChart({ schedule, title }) {
  if (!schedule || schedule.length === 0) return null;
  const totalTime = schedule[schedule.length - 1].end - schedule[0].start;
  const startOffset = schedule[0].start;

  return (
    <div className="gantt-section">
      <h4>{title}</h4>
      <div className="gantt-chart">
        {schedule.map((item, idx) => {
          const widthPct = ((item.end - item.start) / totalTime) * 100;
          let cls = 'gantt-bar ';
          if (item.type === 'idle') cls += 'gantt-idle';
          else if (item.appointmentType === 'emergency') cls += 'gantt-emergency';
          else cls += 'gantt-regular';

          return (
            <div
              key={idx}
              className={cls}
              style={{ width: `${Math.max(widthPct, 3)}%` }}
              title={item.type === 'idle' ? `Idle ${item.start}–${item.end}` : `${item.name} (${item.start}–${item.end})`}
            >
              <span className="gantt-label">{item.type === 'idle' ? 'Idle' : item.id}</span>
            </div>
          );
        })}
      </div>
      {/* Timeline markers */}
      <div className="gantt-timeline">
        {schedule.map((item, idx) => (
          <span key={idx} style={{ width: `${Math.max(((item.end - item.start) / totalTime) * 100, 3)}%` }}>
            {item.start}
          </span>
        ))}
        <span className="gantt-end">{schedule[schedule.length - 1].end}</span>
      </div>
    </div>
  );
}

/* ===== RESULTS TABLE ===== */
function ResultsTable({ schedule, label }) {
  const procs = schedule.filter((s) => s.type === 'process');
  if (procs.length === 0) return null;
  const avgWT = procs.reduce((s, p) => s + p.waitingTime, 0) / procs.length;
  const avgTAT = procs.reduce((s, p) => s + p.turnaroundTime, 0) / procs.length;

  return (
    <div className="results-section">
      <h4>{label} — Results</h4>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Arrival</th>
              <th>Service</th>
              <th>Start</th>
              <th>End</th>
              <th>Waiting</th>
              <th>Turnaround</th>
            </tr>
          </thead>
          <tbody>
            {procs.map((p, i) => (
              <tr key={i} className={p.appointmentType === 'emergency' ? 'row-emergency' : ''}>
                <td>{p.name}</td>
                <td>
                  <span className={`badge ${p.appointmentType === 'emergency' ? 'badge-emergency' : 'badge-regular'}`}>
                    {p.appointmentType}
                  </span>
                </td>
                <td>{p.priority}</td>
                <td>{p.arrivalTime} min</td>
                <td>{p.serviceTime} min</td>
                <td>{p.start} min</td>
                <td>{p.end} min</td>
                <td>{p.waitingTime} min</td>
                <td>{p.turnaroundTime} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="averages">
        <div className="avg-card">
          <span>Avg Waiting Time</span>
          <strong>{avgWT.toFixed(2)} min</strong>
        </div>
        <div className="avg-card">
          <span>Avg Turnaround Time</span>
          <strong>{avgTAT.toFixed(2)} min</strong>
        </div>
      </div>
    </div>
  );
}

/* ===== MAIN PANEL ===== */
export default function SchedulingPanel({ appointments = [] }) {
  const [patients, setPatients] = useState(SAMPLE_PATIENTS);
  const [useApi, setUseApi] = useState(false);

  // Convert real appointments to scheduling format
  useEffect(() => {
    if (useApi && appointments.length > 0) {
      const waiting = appointments.filter((a) => a.status === 'waiting');
      if (waiting.length === 0) {
        setPatients(SAMPLE_PATIENTS);
        return;
      }
      // Convert time strings to relative minutes
      const converted = waiting.map((a) => {
        const parts = (a.arrival_time || '09:00').split(':').map(Number);
        return {
          id: `P${a.id}`,
          name: a.patient_name,
          arrivalTime: parts[0] * 60 + parts[1],
          serviceTime: a.estimated_service_time || 15,
          priority: a.priority || 2,
          appointmentType: a.appointment_type || 'regular'
        };
      });
      const minArr = Math.min(...converted.map((p) => p.arrivalTime));
      converted.forEach((p) => (p.arrivalTime -= minArr));
      setPatients(converted);
    } else {
      setPatients(SAMPLE_PATIENTS);
    }
  }, [useApi, appointments]);

  const fcfs = fcfsScheduling(patients);
  const prio = priorityScheduling(patients);

  // Comparison stats
  const fcfsProcs = fcfs.filter((s) => s.type === 'process');
  const prioProcs = prio.filter((s) => s.type === 'process');
  const fcfsAvgWT = fcfsProcs.length ? fcfsProcs.reduce((s, p) => s + p.waitingTime, 0) / fcfsProcs.length : 0;
  const prioAvgWT = prioProcs.length ? prioProcs.reduce((s, p) => s + p.waitingTime, 0) / prioProcs.length : 0;
  const fcfsAvgTAT = fcfsProcs.length ? fcfsProcs.reduce((s, p) => s + p.turnaroundTime, 0) / fcfsProcs.length : 0;
  const prioAvgTAT = prioProcs.length ? prioProcs.reduce((s, p) => s + p.turnaroundTime, 0) / prioProcs.length : 0;

  return (
    <div className="scheduling-panel">
      <div className="card">
        <h2>⚙️ OS CPU Scheduling Simulation</h2>
        <p className="subtitle">
          CPU scheduling concepts applied to patient appointment ordering.
          Each patient appointment is treated as a process with arrival time and burst (service) time.
        </p>
        <div className="disclaimer">
          ⚠️ <strong>Educational Simulation Only:</strong> This scheduling demonstration is for learning
          Operating Systems concepts. It does not replace actual clinical triage or medical assessment.
        </div>

        {appointments.length > 0 && (
          <label className="toggle-label">
            <input type="checkbox" checked={useApi} onChange={(e) => setUseApi(e.target.checked)} />
            Use actual waiting appointments as input data
          </label>
        )}
      </div>

      {/* Input Data */}
      <div className="card">
        <h3>📋 Patient Queue (Input)</h3>
        <p>Priority: 1 = Emergency (higher), 2 = Regular (lower). Lower number = scheduled first.</p>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Arrival (min)</th>
                <th>Service (min)</th>
                <th>Type</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <tr key={i} className={p.appointmentType === 'emergency' ? 'row-emergency' : ''}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.arrivalTime}</td>
                  <td>{p.serviceTime}</td>
                  <td>
                    <span className={`badge ${p.appointmentType === 'emergency' ? 'badge-emergency' : 'badge-regular'}`}>
                      {p.appointmentType}
                    </span>
                  </td>
                  <td>{p.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FCFS */}
      <div className="card">
        <h3>1️⃣ FCFS — First Come First Serve</h3>
        <p>Patients are scheduled strictly in arrival order. No priority consideration.</p>
        <GanttChart schedule={fcfs} title="FCFS Gantt Chart" />
        <ResultsTable schedule={fcfs} label="FCFS" />
      </div>

      {/* Priority */}
      <div className="card">
        <h3>2️⃣ Non-Preemptive Priority Scheduling</h3>
        <p>
          Emergency patients (priority 1) are scheduled before regular patients (priority 2).
          Among same-priority patients, earlier arrival goes first.
          Once a consultation starts, it runs to completion.
        </p>
        <GanttChart schedule={prio} title="Priority Scheduling Gantt Chart" />
        <ResultsTable schedule={prio} label="Priority Scheduling" />
      </div>

      {/* Comparison */}
      <div className="card">
        <h3>📊 Algorithm Comparison</h3>
        <div className="table-wrapper">
          <table className="data-table comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>FCFS</th>
                <th>Priority</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Scheduling Order</strong></td>
                <td>{fcfsProcs.map((p) => p.id).join(' → ')}</td>
                <td>{prioProcs.map((p) => p.id).join(' → ')}</td>
                <td>{fcfsProcs.map((p) => p.id).join('') === prioProcs.map((p) => p.id).join('') ? 'Same' : 'Different'}</td>
              </tr>
              <tr>
                <td><strong>Avg Waiting Time</strong></td>
                <td>{fcfsAvgWT.toFixed(2)} min</td>
                <td>{prioAvgWT.toFixed(2)} min</td>
                <td>{(prioAvgWT - fcfsAvgWT).toFixed(2)} min</td>
              </tr>
              <tr>
                <td><strong>Avg Turnaround Time</strong></td>
                <td>{fcfsAvgTAT.toFixed(2)} min</td>
                <td>{prioAvgTAT.toFixed(2)} min</td>
                <td>{(prioAvgTAT - fcfsAvgTAT).toFixed(2)} min</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
