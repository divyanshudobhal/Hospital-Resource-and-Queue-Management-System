const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = require('./db');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const PORT = process.env.PORT || 5000;

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());

// Request logger — prints every API call in the terminal
app.use((req, res, next) => {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${req.method} ${req.url}`);
  next();
});

// --------------- Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// --------------- Seed Demo Data ---------------
async function seedDatabase() {
  try {
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (users[0].count > 0) {
      console.log('  i  Database already has data — skipping seed.');
      return;
    }

    console.log('  ...  Seeding database with demo data...');
    const hash = await bcrypt.hash('password123', 10);

    // Insert doctor users
    const [r1] = await pool.query(
      `INSERT INTO users (username, password_hash, role) VALUES
       ('dr.smith', ?, 'doctor'),
       ('dr.jones', ?, 'doctor')`,
      [hash, hash]
    );

    // Insert patient users
    const [r2] = await pool.query(
      `INSERT INTO users (username, password_hash, role) VALUES
       ('patient1', ?, 'patient'),
       ('patient2', ?, 'patient'),
       ('patient3', ?, 'patient')`,
      [hash, hash, hash]
    );

    // Fetch all user IDs
    const [allUsers] = await pool.query('SELECT id, username FROM users');
    const uid = (name) => allUsers.find(u => u.username === name).id;

    // Doctor profiles
    await pool.query(
      `INSERT INTO doctors (user_id, name, specialization, phone) VALUES
       (?, 'Dr. Sarah Smith', 'General Medicine', '555-0101'),
       (?, 'Dr. Michael Jones', 'Cardiology', '555-0102')`,
      [uid('dr.smith'), uid('dr.jones')]
    );

    // Patient profiles
    await pool.query(
      `INSERT INTO patients (user_id, name, age, gender, phone, blood_group) VALUES
       (?, 'Alice Johnson', 30, 'Female', '555-0201', 'A+'),
       (?, 'Bob Williams', 45, 'Male', '555-0202', 'O+'),
       (?, 'Charlie Brown', 28, 'Male', '555-0203', 'B+')`,
      [uid('patient1'), uid('patient2'), uid('patient3')]
    );

    // Sample appointments for today
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO appointments
       (patient_id, doctor_id, appointment_date, arrival_time, estimated_service_time, appointment_type, priority, status, reason)
       VALUES
       (1, 1, ?, '09:00:00', 20, 'regular',   2, 'waiting',   'Regular checkup'),
       (2, 1, ?, '09:15:00', 15, 'emergency', 1, 'waiting',   'Chest pain'),
       (3, 1, ?, '09:30:00', 25, 'regular',   2, 'waiting',   'Follow-up visit'),
       (1, 1, ?, '10:00:00', 15, 'regular',   2, 'completed', 'Blood test review'),
       (2, 2, ?, '09:00:00', 30, 'emergency', 1, 'waiting',   'Heart palpitations')`,
      [today, today, today, today, today]
    );

    console.log('');
    console.log('  ✓  Demo data seeded successfully!');
    console.log('  ┌──────────────────────────────────────┐');
    console.log('  │  Demo Accounts (password: password123)│');
    console.log('  ├──────────────────────────────────────┤');
    console.log('  │  Doctor:  dr.smith                   │');
    console.log('  │  Doctor:  dr.jones                   │');
    console.log('  │  Patient: patient1                   │');
    console.log('  │  Patient: patient2                   │');
    console.log('  │  Patient: patient3                   │');
    console.log('  └──────────────────────────────────────┘');
  } catch (err) {
    console.error('  ✗  Seed error:', err.message);
  }
}

// --------------- Start Server ---------------
app.listen(PORT, async () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════════╗');
  console.log('  ║   Hospital Management System — Backend Server ║');
  console.log('  ╚═══════════════════════════════════════════════╝');
  console.log(`  Server  : http://localhost:${PORT}`);
  console.log(`  Started : ${new Date().toLocaleString()}`);
  console.log('');

  // Test DB connection
  try {
    await pool.query('SELECT 1');
    console.log('  ✓  MySQL connected');
    await seedDatabase();
  } catch (err) {
    console.error('  ✗  MySQL connection failed:', err.message);
    console.error('     Make sure MySQL is running and check your .env file.');
  }

  console.log('');
  console.log('  API Endpoints:');
  console.log('  POST   /api/auth/login');
  console.log('  GET    /api/patients');
  console.log('  GET    /api/patients/profile');
  console.log('  GET    /api/appointments');
  console.log('  POST   /api/appointments');
  console.log('  PATCH  /api/appointments/:id/status');
  console.log('  GET    /api/appointments/doctors');
  console.log('  GET    /api/health');
  console.log('');
  console.log('  Waiting for requests...');
  console.log('  ' + '─'.repeat(48));
});
