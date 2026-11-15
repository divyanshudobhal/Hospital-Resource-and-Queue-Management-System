const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const osSchedulingRoutes = require('./routes/osScheduling');
require('dotenv').config();

const {
  mongoose,
  connectDatabase,
  ensureMongoViews,
  User,
  Doctor,
  Patient,
  Appointment
} = require('./db');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');
const medicalRecordRoutes = require('./routes/medicalRecords');
const notificationRoutes = require('./routes/notifications');
const osConceptRoutes = require('./routes/osConcepts');

const app = express();
const PORT = process.env.PORT || 5000;

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());
app.use('/api/os-scheduling', osSchedulingRoutes);

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
app.use('/api/admin', adminRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/os-concepts', osConceptRoutes);

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
  const demoPatientNames = [
    ['patient1', 'pulkit', 'Pulkit'],
    ['patient2', 'swastika', 'Swastika'],
    ['patient3', 'srishti', 'Srishti']
  ];

  for (const [oldUsername, username, name] of demoPatientNames) {
    const oldUser = await User.findOne({ username: oldUsername });
    if (!oldUser) continue;
    const newUser = await User.findOne({ username });
    if (newUser && !newUser._id.equals(oldUser._id)) {
      console.warn(`  ! Demo username ${username} already exists; keeping ${oldUsername}.`);
      continue;
    }
    oldUser.username = username;
    await oldUser.save();
    await Patient.updateOne({ user_id: oldUser._id }, { name });
  }

  const demoDoctorAccounts = [
    ['dr.smith', 'dr.aarav', 'Dr. Aarav Sharma'],
    ['dr.jones', 'dr.priya', 'Dr. Priya Iyer']
  ];

  for (const [oldUsername, username, name] of demoDoctorAccounts) {
    const oldUser = await User.findOne({ username: oldUsername });
    if (!oldUser) continue;
    const newUser = await User.findOne({ username });
    if (newUser && !newUser._id.equals(oldUser._id)) {
      console.warn(`  ! Demo username ${username} already exists; keeping ${oldUsername}.`);
      continue;
    }
    oldUser.username = username;
    await oldUser.save();
    await Doctor.updateOne({ user_id: oldUser._id }, { name });
  }

  const existingUserCount = await User.countDocuments({ role: { $in: ['doctor', 'patient'] } });
  if (!await User.exists({ username: 'admin' })) {
    const adminHash = await bcrypt.hash('password123', 10);
    await User.create({ username: 'admin', password_hash: adminHash, role: 'admin' });
  }

  if (existingUserCount > 0) {
    console.log('  i  Database already has data — skipping seed.');
    return;
  }

  console.log('  ...  Seeding database with demo data...');
  const hash = await bcrypt.hash('password123', 10);
  const users = await User.insertMany([
    { username: 'dr.aarav', password_hash: hash, role: 'doctor' },
    { username: 'dr.priya', password_hash: hash, role: 'doctor' },
    { username: 'pulkit', password_hash: hash, role: 'patient' },
    { username: 'swastika', password_hash: hash, role: 'patient' },
    { username: 'srishti', password_hash: hash, role: 'patient' }
  ]);
  const userByName = Object.fromEntries(users.map(user => [user.username, user]));

  const doctors = await Doctor.create([
    { user_id: userByName['dr.aarav']._id, name: 'Dr. Aarav Sharma', specialization: 'General Medicine', phone: '555-0101' },
    { user_id: userByName['dr.priya']._id, name: 'Dr. Priya Iyer', specialization: 'Cardiology', phone: '555-0102' }
  ]);
  const patients = await Patient.create([
    { user_id: userByName.pulkit._id, name: 'Pulkit', age: 30, gender: 'Male', phone: '555-0201', blood_group: 'A+' },
    { user_id: userByName.swastika._id, name: 'Swastika', age: 45, gender: 'Female', phone: '555-0202', blood_group: 'O+' },
    { user_id: userByName.srishti._id, name: 'Srishti', age: 28, gender: 'Female', phone: '555-0203', blood_group: 'B+' }
  ]);

  const today = new Date().toISOString().split('T')[0];
  await Appointment.create([
    { patient_id: patients[0]._id, doctor_id: doctors[0]._id, appointment_date: today, arrival_time: '09:00:00', estimated_service_time: 20, appointment_type: 'regular', priority: 2, status: 'waiting', reason: 'Regular checkup' },
    { patient_id: patients[1]._id, doctor_id: doctors[0]._id, appointment_date: today, arrival_time: '09:15:00', estimated_service_time: 15, appointment_type: 'emergency', priority: 1, status: 'waiting', reason: 'Chest pain' },
    { patient_id: patients[2]._id, doctor_id: doctors[0]._id, appointment_date: today, arrival_time: '09:30:00', estimated_service_time: 25, appointment_type: 'regular', priority: 2, status: 'waiting', reason: 'Follow-up visit' },
    { patient_id: patients[0]._id, doctor_id: doctors[0]._id, appointment_date: today, arrival_time: '10:00:00', estimated_service_time: 15, appointment_type: 'regular', priority: 2, status: 'completed', reason: 'Blood test review' },
    { patient_id: patients[1]._id, doctor_id: doctors[1]._id, appointment_date: today, arrival_time: '09:00:00', estimated_service_time: 30, appointment_type: 'emergency', priority: 1, status: 'waiting', reason: 'Heart palpitations' }
  ]);

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
  console.log('  │  Admin:   admin                        │');
  console.log('  └──────────────────────────────────────┘');
}

async function waitForDatabase(retries = 20, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await connectDatabase();
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
async function startServer() {
  await waitForDatabase();
  console.log('  ✓  MongoDB connected');
  await ensureMongoViews();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log('');
    console.log('  ╔═══════════════════════════════════════════════╗');
    console.log('  ║   Hospital Management System — Backend Server ║');
    console.log('  ╚═══════════════════════════════════════════════╝');
    console.log(`  Server  : http://localhost:${PORT}`);
    console.log(`  Started : ${new Date().toLocaleString()}`);
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
    console.log('  GET    /api/admin/overview');
    console.log('  GET    /api/medical-records');
    console.log('  GET    /api/notifications/stream');
    console.log('  POST   /api/os-concepts/deadlock');
    console.log('  GET    /api/health');
    console.log('');
    console.log('  Waiting for requests...');
    console.log('  ' + '─'.repeat(48));
  });
}

startServer().catch(async err => {
  console.error('  ✗  MongoDB startup failed:', err.message);
  console.error('     Make sure MongoDB is running and MONGODB_URI is correct.');
  await mongoose.disconnect();
  process.exitCode = 1;
});
