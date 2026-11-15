const express = require('express');
const { User, Doctor, Patient, Appointment } = require('../db');
const { getAppointmentQueueView, getAppointmentSummary } = require('../services/mongoConcepts');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(verifyToken, authorizeRole('admin'));

router.get('/overview', async (req, res) => {
  try {
    const [users, doctors, patients, appointments, waiting, appointmentSummary] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'waiting' }),
      getAppointmentSummary()
    ]);
    res.json({ users, doctors, patients, appointments, waiting, appointmentSummary });
  } catch (err) {
    console.error('  ✗ Error loading admin overview:', err.message);
    res.status(500).json({ message: 'Error loading admin overview.' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('username role created_at').sort({ role: 1, username: 1 });
    res.json(users.map(({ id, username, role, created_at }) => ({ id, username, role, created_at })));
  } catch (err) {
    console.error('  ✗ Error loading admin users:', err.message);
    res.status(500).json({ message: 'Error loading user accounts.' });
  }
});

router.get('/database-demo', async (req, res) => {
  try {
    const [queueView, appointmentSummary] = await Promise.all([
      getAppointmentQueueView(),
      getAppointmentSummary()
    ]);
    res.json({ view: queueView, aggregation: appointmentSummary });
  } catch (err) {
    console.error('  ✗ Error loading MongoDB demo:', err.message);
    res.status(500).json({ message: 'Error loading MongoDB demonstrations.' });
  }
});

module.exports = router;
