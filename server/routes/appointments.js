const express = require('express');
const pool = require('../db');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/appointments/doctors - Get doctor list for booking
router.get('/doctors', verifyToken, async (req, res) => {
  try {
    const [doctors] = await pool.query(
      'SELECT id, name, specialization FROM doctors ORDER BY name'
    );
    res.json(doctors);
  } catch (err) {
    console.error('  ✗ Error fetching doctors:', err.message);
    res.status(500).json({ message: 'Error fetching doctors.' });
  }
});

// GET /api/appointments - Filtered by role
router.get('/', verifyToken, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'doctor') {
      // Doctor sees appointments assigned to them
      query = `
        SELECT a.*, p.name AS patient_name, d.name AS doctor_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.doctor_id = ?
        ORDER BY a.appointment_date DESC, a.priority ASC, a.arrival_time ASC
      `;
      params = [req.user.profileId];
    } else {
      // Patient sees only their own appointments
      query = `
        SELECT a.*, p.name AS patient_name, d.name AS doctor_name, d.specialization
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC, a.arrival_time ASC
      `;
      params = [req.user.profileId];
    }

    const [appointments] = await pool.query(query, params);
    console.log(`  ✓ Fetched ${appointments.length} appointments for ${req.user.role}`);
    res.json(appointments);
  } catch (err) {
    console.error('  ✗ Error fetching appointments:', err.message);
    res.status(500).json({ message: 'Error fetching appointments.' });
  }
});

// POST /api/appointments - Patient books an appointment
router.post('/', verifyToken, authorizeRole('patient'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { doctor_id, appointment_date, arrival_time, estimated_service_time, appointment_type, reason } = req.body;
    const patient_id = req.user.profileId;

    // SERVER sets priority based on type — patients cannot set their own priority
    const priority = appointment_type === 'emergency' ? 1 : 2;
    const serviceTime = estimated_service_time || 15;

    if (!doctor_id || !appointment_date || !arrival_time) {
      return res.status(400).json({ message: 'Doctor, date, and arrival time are required.' });
    }

    await connection.beginTransaction();

    // Check for duplicate booking (same doctor, date, time) using transaction
    const [existing] = await connection.query(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? AND arrival_time = ? AND status != 'completed'`,
      [doctor_id, appointment_date, arrival_time]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'This time slot is already booked. Please choose a different time.' });
    }

    // Insert appointment
    const [result] = await connection.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, arrival_time,
       estimated_service_time, appointment_type, priority, status, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting', ?)`,
      [patient_id, doctor_id, appointment_date, arrival_time, serviceTime, appointment_type, priority, reason]
    );

    await connection.commit();

    console.log(`  ✓ New ${appointment_type} appointment #${result.insertId} booked`);
    res.status(201).json({
      message: 'Appointment booked successfully',
      appointmentId: result.insertId
    });
  } catch (err) {
    await connection.rollback();
    console.error('  ✗ Error booking appointment:', err.message);
    res.status(500).json({ message: 'Error booking appointment.' });
  } finally {
    connection.release();
  }
});

// PATCH /api/appointments/:id/status - Doctor updates appointment status
router.patch('/:id/status', verifyToken, authorizeRole('doctor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['waiting', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use: waiting, in-progress, or completed.' });
    }

    // Verify appointment belongs to this doctor
    const [appointments] = await pool.query(
      'SELECT id FROM appointments WHERE id = ? AND doctor_id = ?',
      [id, req.user.profileId]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found or access denied.' });
    }

    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);

    console.log(`  ✓ Appointment #${id} → ${status}`);
    res.json({ message: `Appointment status updated to ${status}` });
  } catch (err) {
    console.error('  ✗ Error updating status:', err.message);
    res.status(500).json({ message: 'Error updating appointment status.' });
  }
});

module.exports = router;
