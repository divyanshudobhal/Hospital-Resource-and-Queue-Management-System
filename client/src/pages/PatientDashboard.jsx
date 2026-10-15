import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';

export default function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookMsg, setBookMsg] = useState({ text: '', type: '' });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // Booking form state
  const [form, setForm] = useState({
    doctor_id: '',
    appointment_date: '',
    arrival_time: '',
    estimated_service_time: 15,
    appointment_type: 'regular',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [profileRes, apptRes, docRes] = await Promise.all([
        fetch('/api/patients/profile', { headers: authHeaders }),
        fetch('/api/appointments', { headers: authHeaders }),
        fetch('/api/appointments/doctors', { headers: authHeaders })
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (apptRes.ok) setAppointments(await apptRes.json());
      if (docRes.ok) {
        const docList = await docRes.json();
        setDoctors(docList);
        if (docList.length > 0 && !form.doctor_id) {
          setForm((f) => ({ ...f, doctor_id: docList[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  }

  async function handleBook(e) {
    e.preventDefault();
    setBooking(true);
    setBookMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        setBookMsg({ text: 'Appointment booked successfully!', type: 'success' });
        setForm(f => ({ ...f, appointment_date: '', arrival_time: '', reason: '', appointment_type: 'regular' }));
        // Refresh appointments
        const apptRes = await fetch('/api/appointments', { headers: authHeaders });
        if (apptRes.ok) setAppointments(await apptRes.json());
      } else {
        setBookMsg({ text: data.message || 'Booking failed', type: 'error' });
      }
    } catch (err) {
      setBookMsg({ text: 'Cannot connect to server.', type: 'error' });
    }
    setBooking(false);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }

  // Separate upcoming and past appointments
  const today = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(
    (a) => a.status !== 'completed' && a.appointment_date && a.appointment_date.split('T')[0] >= today
  );
  const history = appointments.filter(
    (a) => a.status === 'completed' || (a.appointment_date && a.appointment_date.split('T')[0] < today)
  );

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-shell">
      <AppNavbar role="patient" username={user.username} onLogout={logout} />
      <main className="dashboard">
      <section className="page-heading">
        <div>
          <p className="eyebrow">PATIENT PORTAL</p>
          <h1>Welcome back, {profile?.name || user.username || 'there'}</h1>
          <p>Book a visit and keep track of your care in one place.</p>
        </div>
        <span className="today-label">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
      </section>

      <div className="patient-grid">
        {/* Left Column: Profile + Book Appointment */}
        <div className="patient-left" id="profile">
          {/* Profile Card */}
          {profile && (
            <div className="card profile-card">
              <h2>👤 My Profile</h2>
              <div className="profile-details">
                <p><strong>Name:</strong> {profile.name}</p>
                <p><strong>Age:</strong> {profile.age}</p>
                <p><strong>Gender:</strong> {profile.gender}</p>
                <p><strong>Phone:</strong> {profile.phone}</p>
                <p><strong>Blood Group:</strong> <span className="badge badge-info">{profile.blood_group}</span></p>
              </div>
            </div>
          )}

          {/* Book Appointment */}
          <div className="card" id="booking">
            <h2>📅 Book Appointment</h2>

            {/* Emergency Disclaimer */}
            <div className="disclaimer">
              ⚠️ <strong>Important:</strong> If you are experiencing a real medical emergency, please call
              emergency services or visit your nearest emergency room immediately. This online booking
              system is for scheduling purposes only and does not replace emergency medical care.
            </div>

            {bookMsg.text && (
              <div className={`alert ${bookMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {bookMsg.text}
              </div>
            )}

            <form onSubmit={handleBook}>
              <div className="form-group">
                <label>Doctor</label>
                <select
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: Number(e.target.value) })}
                  required
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={form.appointment_date}
                    onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                    min={today}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Arrival Time</label>
                  <input
                    type="time"
                    value={form.arrival_time}
                    onChange={(e) => setForm({ ...form, arrival_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <select
                    value={form.estimated_service_time}
                    onChange={(e) => setForm({ ...form, estimated_service_time: Number(e.target.value) })}
                  >
                    <option value={10}>10 min</option>
                    <option value={15}>15 min</option>
                    <option value={20}>20 min</option>
                    <option value={25}>25 min</option>
                    <option value={30}>30 min</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Appointment Type</label>
                  <select
                    value={form.appointment_type}
                    onChange={(e) => setForm({ ...form, appointment_type: e.target.value })}
                  >
                    <option value="regular">Regular</option>
                    <option value="emergency">🚨 Emergency</option>
                  </select>
                </div>
              </div>

              {form.appointment_type === 'emergency' && (
                <div className="alert alert-warning">
                  🚨 <strong>Emergency Selection:</strong> This marks your appointment with higher scheduling
                  priority for demonstration purposes. For a real medical emergency, seek immediate
                  emergency care.
                </div>
              )}

              <div className="form-group">
                <label>Reason for Visit</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Describe your symptoms or reason for the visit"
                  rows={3}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={booking}>
                {booking ? 'Booking...' : 'Book Appointment'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Upcoming + History */}
        <div className="patient-right" id="appointments">
          {/* Upcoming Appointments */}
          <div className="card">
            <h2>📌 Upcoming Appointments</h2>
            {upcoming.length === 0 ? (
              <p className="empty">No upcoming appointments.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Doctor</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((a) => (
                      <tr key={a.id} className={a.appointment_type === 'emergency' ? 'row-emergency' : ''}>
                        <td>{a.appointment_date ? a.appointment_date.split('T')[0] : ''}</td>
                        <td>{a.arrival_time}</td>
                        <td>{a.doctor_name}{a.specialization ? ` (${a.specialization})` : ''}</td>
                        <td>
                          <span className={`badge ${a.appointment_type === 'emergency' ? 'badge-emergency' : 'badge-regular'}`}>
                            {a.appointment_type === 'emergency' ? '🚨 ' : ''}{a.appointment_type}
                          </span>
                        </td>
                        <td>
                          <span className={`status status-${a.status}`}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Appointment History */}
          <div className="card">
            <h2>📜 Appointment History</h2>
            {history.length === 0 ? (
              <p className="empty">No past appointments.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Doctor</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((a) => (
                      <tr key={a.id}>
                        <td>{a.appointment_date ? a.appointment_date.split('T')[0] : ''}</td>
                        <td>{a.doctor_name}</td>
                        <td>
                          <span className={`badge ${a.appointment_type === 'emergency' ? 'badge-emergency' : 'badge-regular'}`}>
                            {a.appointment_type}
                          </span>
                        </td>
                        <td>{a.reason || '—'}</td>
                        <td>
                          <span className={`status status-${a.status}`}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
