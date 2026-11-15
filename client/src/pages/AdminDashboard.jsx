import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import LiveNotifications from '../components/LiveNotifications';

const EMPTY_OVERVIEW = {
  users: 0,
  doctors: 0,
  patients: 0,
  appointments: 0,
  waiting: 0,
  appointmentSummary: { byStatus: [], byType: [] }
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [users, setUsers] = useState([]);
  const [databaseDemo, setDatabaseDemo] = useState({ view: [], aggregation: { byStatus: [], byType: [] } });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [overviewResponse, usersResponse, demoResponse] = await Promise.all([
          fetch('/api/admin/overview', { headers }),
          fetch('/api/admin/users', { headers }),
          fetch('/api/admin/database-demo', { headers })
        ]);
        if (!overviewResponse.ok || !usersResponse.ok || !demoResponse.ok) {
          throw new Error('Could not load the administrator dashboard.');
        }
        setOverview(await overviewResponse.json());
        setUsers(await usersResponse.json());
        setDatabaseDemo(await demoResponse.json());
      } catch (loadError) {
        setError(loadError.message);
      }
    }
    loadDashboard();
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }

  return (
    <div className="dashboard-shell">
      <AppNavbar role="admin" username={user.username} onLogout={logout} />
      <LiveNotifications />
      <main className="dashboard">
        <section className="page-heading">
          <div>
            <p className="eyebrow">ADMINISTRATION</p>
            <h1>Hospital overview</h1>
            <p>Monitor accounts, appointments, and MongoDB demonstrations.</p>
          </div>
          <span className="today-label">{new Date().toLocaleDateString()}</span>
        </section>

        {error && <p role="alert" className="alert alert-error">{error}</p>}

        <section className="stats-grid" aria-label="Hospital statistics">
          {[
            ['User accounts', overview.users],
            ['Doctors', overview.doctors],
            ['Patients', overview.patients],
            ['Appointments', overview.appointments],
            ['Waiting', overview.waiting]
          ].map(([label, value]) => (
            <article className="stat-card" key={label}>
              <div className="stat-number">{value}</div>
              <div className="stat-label">{label}</div>
            </article>
          ))}
        </section>

        <section className="card">
          <h2>Account directory</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Username</th><th>Role</th><th>Created</th></tr></thead>
              <tbody>
                {users.map((account) => (
                  <tr key={account.id}>
                    <td>{account.username}</td>
                    <td>{account.role}</td>
                    <td>{new Date(account.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2>MongoDB view: appointment_queue_view</h2>
          <p>This read-only database view joins appointment documents with patient and doctor names.</p>
          {databaseDemo.view.length === 0 ? <p className="empty">No appointments to display yet.</p> : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  {databaseDemo.view.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.appointment_date}</td>
                      <td>{appointment.arrival_time}</td>
                      <td>{appointment.patient_name || '—'}</td>
                      <td>{appointment.doctor_name || '—'}</td>
                      <td>{appointment.appointment_type}</td>
                      <td>{appointment.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h2>MongoDB aggregation: appointment summary</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Group</th><th>Value</th><th>Count</th></tr></thead>
              <tbody>
                {databaseDemo.aggregation.byStatus.map((row) => (
                  <tr key={`status-${row._id}`}><td>Status</td><td>{row._id}</td><td>{row.count}</td></tr>
                ))}
                {databaseDemo.aggregation.byType.map((row) => (
                  <tr key={`type-${row._id}`}><td>Type</td><td>{row._id}</td><td>{row.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Mongoose validation middleware also assigns appointment priority from emergency/regular type, acting as a MongoDB-side trigger equivalent.</p>
        </section>
      </main>
    </div>
  );
}
