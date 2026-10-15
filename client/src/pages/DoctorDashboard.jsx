import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SchedulingPanel from '../components/SchedulingPanel';
import AppNavbar from '../components/AppNavbar';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [apptRes, patRes] = await Promise.all([
        fetch('/api/appointments', { headers: authHeaders }),
        fetch('/api/patients', { headers: authHeaders })
      ]);

      if (apptRes.ok) setAppointments(await apptRes.json());
      if (patRes.ok) setPatients(await patRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  }

  // Mark appointment as completed
  async function markComplete(id) {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: 'completed' })
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a))
        );
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }

  // Compute stats
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(
    (a) => a.appointment_date && a.appointment_date.split('T')[0] === today
  );
  const waitingEmergency = todayAppts.filter(
    (a) => a.status === 'waiting' && a.appointment_type === 'emergency'
  );
  const waitingRegular = todayAppts.filter(
    (a) => a.status === 'waiting' && a.appointment_type === 'regular'
  );

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-shell">
      <AppNavbar
        role="doctor"
        username={user.username}
        activeSection={activeTab}
        onSectionChange={setActiveTab}
        onLogout={logout}
      />
      <main className="dashboard">
      <section className="page-heading">
        <div>
          <p className="eyebrow">DOCTOR WORKSPACE</p>
          <h1>{activeTab === 'dashboard' ? 'Clinic overview' : 'OS Scheduling'}</h1>
          <p>{activeTab === 'dashboard' ? 'Here is what is happening with your clinic today.' : 'Compare patient queues with CPU scheduling algorithms.'}</p>
        </div>
        <span className="today-label">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
      </section>

      {activeTab === 'dashboard' ? (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{patients.length}</div>
              <div className="stat-label">Total Patients</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{todayAppts.length}</div>
              <div className="stat-label">Today's Appointments</div>
            </div>
            <div className="stat-card stat-emergency">
              <div className="stat-number">{waitingEmergency.length}</div>
              <div className="stat-label">Emergency Waiting</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{waitingRegular.length}</div>
              <div className="stat-label">Regular Waiting</div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="card">
            <h2>Today's Appointments</h2>
            {todayAppts.length === 0 ? (
              <p className="empty">No appointments for today.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Patient</th>
                      <th>Type</th>
                      <th>Arrival</th>
                      <th>Duration</th>
                      <th>Priority</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAppts.map((a) => (
                      <tr key={a.id} className={a.appointment_type === 'emergency' ? 'row-emergency' : ''}>
                        <td>#{a.id}</td>
                        <td>{a.patient_name}</td>
                        <td>
                          <span className={`badge ${a.appointment_type === 'emergency' ? 'badge-emergency' : 'badge-regular'}`}>
                            {a.appointment_type === 'emergency' ? '🚨 ' : ''}{a.appointment_type}
                          </span>
                        </td>
                        <td>{a.arrival_time}</td>
                        <td>{a.estimated_service_time} min</td>
                        <td>{a.priority === 1 ? '⬆ High' : '— Normal'}</td>
                        <td>{a.reason || '—'}</td>
                        <td>
                          <span className={`status status-${a.status}`}>
                            {a.status}
                          </span>
                        </td>
                        <td>
                          {a.status !== 'completed' ? (
                            <button className="btn btn-sm btn-success" onClick={() => markComplete(a.id)}>
                              ✓ Complete
                            </button>
                          ) : (
                            <span className="text-muted">Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Patient Details */}
          <div className="card">
            <h2>Patient Details</h2>
            {patients.length === 0 ? (
              <p className="empty">No patients found.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Phone</th>
                      <th>Blood Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td>{p.name}</td>
                        <td>{p.age}</td>
                        <td>{p.gender}</td>
                        <td>{p.phone}</td>
                        <td>{p.blood_group}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <SchedulingPanel appointments={appointments} />
      )}
      </main>
    </div>
  );
}
