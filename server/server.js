const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
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

// In production, serve the Vite build from the same origin as the API.
const staticDir = process.env.STATIC_DIR || path.join(__dirname, 'public');
const indexFile = path.join(staticDir, 'index.html');
if (fs.existsSync(indexFile)) {
  app.use(express.static(staticDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(indexFile);
  });
}

// --------------- Seed Demo Data ---------------
async function seedDatabase() {
  try {
    const demoPatientNames = [
      ['patient1', 'pulkit', 'Pulkit'],
      ['patient2', 'swastika', 'Swastika'],
      ['patient3', 'srishti', 'Srishti']
    ];

    // Rename seeded accounts without changing their IDs or existing appointments.
    for (const [oldUsername, username, name] of demoPatientNames) {
      const [oldUsers] = await pool.query('SELECT id FROM users WHERE username = ?', [oldUsername]);
      if (oldUsers.length === 0) continue;
      const [newUsers] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
      if (newUsers.length > 0 && newUsers[0].id !== oldUsers[0].id) {
        console.warn(`  ! Demo username ${username} already exists; keeping ${oldUsername}.`);
        continue;
      }
      await pool.query('UPDATE users SET username = ? WHERE id = ?', [username, oldUsers[0].id]);
      await pool.query('UPDATE patients SET name = ? WHERE user_id = ?', [name, oldUsers[0].id]);
    }

    const demoDoctorAccounts = [
      ['dr.smith', 'dr.aarav', 'Dr. Aarav Sharma'],
      ['dr.jones', 'dr.priya', 'Dr. Priya Iyer']
    ];

    // Give the seeded doctor accounts Indian names without changing their IDs or appointments.
    for (const [oldUsername, username, name] of demoDoctorAccounts) {
      const [oldUsers] = await pool.query('SELECT id FROM users WHERE username = ?', [oldUsername]);
      if (oldUsers.length === 0) continue;
      const [newUsers] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
      if (newUsers.length > 0 && newUsers[0].id !== oldUsers[0].id) {
        console.warn(`  ! Demo username ${username} already exists; keeping ${oldUsername}.`);
        continue;
      }
      await pool.query('UPDATE users SET username = ? WHERE id = ?', [username, oldUsers[0].id]);
      await pool.query('UPDATE doctors SET name = ? WHERE user_id = ?', [name, oldUsers[0].id]);
    }

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
       ('dr.aarav', ?, 'doctor'),
       ('dr.priya', ?, 'doctor')`,
      [hash, hash]
    );

    // Insert patient users
    const [r2] = await pool.query(
      `INSERT INTO users (username, password_hash, role) VALUES
       ('pulkit', ?, 'patient'),
       ('swastika', ?, 'patient'),
       ('srishti', ?, 'patient')`,
      [hash, hash, hash]
    );

    // Fetch all user IDs
    const [allUsers] = await pool.query('SELECT id, username FROM users');
    const uid = (name) => allUsers.find(u => u.username === name).id;

    // Doctor profiles
    await pool.query(
      `INSERT INTO doctors (user_id, name, specialization, phone) VALUES
       (?, 'Dr. Aarav Sharma', 'General Medicine', '555-0101'),
       (?, 'Dr. Priya Iyer', 'Cardiology', '555-0102')`,
      [uid('dr.aarav'), uid('dr.priya')]
    );

    // Patient profiles
    await pool.query(
      `INSERT INTO patients (user_id, name, age, gender, phone, blood_group) VALUES
       (?, 'Pulkit', 30, 'Male', '555-0201', 'A+'),
       (?, 'Swastika', 45, 'Female', '555-0202', 'O+'),
       (?, 'Srishti', 28, 'Female', '555-0203', 'B+')`,
      [uid('pulkit'), uid('swastika'), uid('srishti')]
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
    console.log('  │  Doctor:  dr.aarav                   │');
    console.log('  │  Doctor:  dr.priya                   │');
    console.log('  │  Patient: pulkit                     │');
    console.log('  │  Patient: swastika                   │');
    console.log('  │  Patient: srishti                    │');
    console.log('  └──────────────────────────────────────┘');
  } catch (err) {
    console.error('  ✗  Seed error:', err.message);
  }
}

async function waitForDatabase(retries = 20, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      console.warn(`  ! Database not ready yet (attempt ${attempt}/${retries}). Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
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

  // Test DB connection with retry loop to handle startup races in Docker Compose.
  try {
    await waitForDatabase();
    console.log('  ✓  MySQL connected');
    await seedDatabase();
  } catch (err) {
    console.error('  ✗  MySQL connection failed:', err.message);
    console.error('     Make sure MySQL is running and check your .env file.');
  }

  console.log('');
  console.log('  API Endpoints:');
  console.log('  POST   /api/auth/login');
  console.log('  POST   /api/auth/signup');
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
