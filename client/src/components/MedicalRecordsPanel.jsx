import { useEffect, useMemo, useState } from 'react';

export default function MedicalRecordsPanel({ patients, appointments }) {
  const token = localStorage.getItem('token');
  const assignedPatientIds = useMemo(
    () => new Set(appointments.map((appointment) => appointment.patient_id)),
    [appointments]
  );
  const assignedPatients = useMemo(
    () => patients.filter((patient) => assignedPatientIds.has(patient.id)),
    [patients, assignedPatientIds]
  );
  const [patientId, setPatientId] = useState('');
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ diagnosis: '', treatment: '', notes: '', appointment_id: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!assignedPatients.some((patient) => patient.id === patientId)) {
      setPatientId(assignedPatients[0]?.id || '');
    }
  }, [assignedPatients, patientId]);

  async function loadRecords() {
    try {
      const response = await fetch('/api/medical-records', { headers });
      if (!response.ok) throw new Error('Could not load medical records.');
      setRecords(await response.json());
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  async function addRecord(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          ...form,
          appointment_id: form.appointment_id || undefined
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not save medical record.');
      setMessage(result.message);
      setForm({ diagnosis: '', treatment: '', notes: '', appointment_id: '' });
      await loadRecords();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  const patientAppointments = appointments.filter((appointment) => appointment.patient_id === patientId);
  const patientRecords = records.filter((record) => record.patient_id === patientId);

  return (
    <section className="card">
      <h2>Patient Medical Records</h2>
      <p>Create educational demo records for patients assigned to your appointments.</p>
      {assignedPatients.length === 0 ? (
        <p className="empty">No assigned patients are available for records.</p>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="record-patient">Patient</label>
            <select id="record-patient" value={patientId} onChange={(event) => setPatientId(event.target.value)}>
              {assignedPatients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.name}</option>
              ))}
            </select>
          </div>
          <form onSubmit={addRecord}>
            <div className="form-group">
              <label htmlFor="record-appointment">Related appointment (optional)</label>
              <select
                id="record-appointment"
                value={form.appointment_id}
                onChange={(event) => setForm({ ...form, appointment_id: event.target.value })}
              >
                <option value="">Not linked to an appointment</option>
                {patientAppointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {appointment.appointment_date} {appointment.arrival_time}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="record-diagnosis">Diagnosis</label>
              <input
                id="record-diagnosis"
                maxLength="200"
                required
                value={form.diagnosis}
                onChange={(event) => setForm({ ...form, diagnosis: event.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="record-treatment">Treatment</label>
              <textarea
                id="record-treatment"
                maxLength="1000"
                value={form.treatment}
                onChange={(event) => setForm({ ...form, treatment: event.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="record-notes">Notes</label>
              <textarea
                id="record-notes"
                maxLength="2000"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </div>
            <button className="btn btn-primary" type="submit">Save medical record</button>
          </form>
        </>
      )}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" className="alert alert-error">{error}</p>}
      <h3>Records for selected patient</h3>
      {patientRecords.length === 0 ? (
        <p className="empty">No records for this patient yet.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Diagnosis</th><th>Treatment</th><th>Notes</th></tr></thead>
            <tbody>
              {patientRecords.map((record) => (
                <tr key={record.id}>
                  <td>{new Date(record.created_at).toLocaleDateString()}</td>
                  <td>{record.diagnosis}</td>
                  <td>{record.treatment || '—'}</td>
                  <td>{record.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
