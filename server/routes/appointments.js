const express = require('express');
const mongoose = require('mongoose');
const { Appointment, Doctor, Patient } = require('../db');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { publishNotification } = require('../services/notifications');

const router = express.Router();

function appointmentResponse(appointment, includeSpecialization) {
  const patient = appointment.patient_id;
  const doctor = appointment.doctor_id;
  const result = {
    id: appointment.id,
    patient_id: patient.id,
    doctor_id: doctor.id,
    appointment_date: appointment.appointment_date,
    arrival_time: appointment.arrival_time,
    estimated_service_time: appointment.estimated_service_time,
    appointment_type: appointment.appointment_type,
    priority: appointment.priority,
    status: appointment.status,
    reason: appointment.reason ?? null,
    created_at: appointment.created_at,
    patient_name: patient.name,
    doctor_name: doctor.name
  };
  if (includeSpecialization) result.specialization = doctor.specialization;
  return result;
}

// GET /api/appointments/doctors - Get doctor list for booking
router.get('/doctors', verifyToken, async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ name: 1 });
    res.json(doctors.map(doctor => ({
      id: doctor.id,
      name: doctor.name,
      specialization: doctor.specialization
    })));
  } catch (err) {
    console.error('  ✗ Error fetching doctors:', err.message);
    res.status(500).json({ message: 'Error fetching doctors.' });
  }
});

// GET /api/appointments - Filtered by role
router.get('/', verifyToken, async (req, res) => {
  try {
    const isDoctor = req.user.role === 'doctor';
    const filter = isDoctor
      ? { doctor_id: req.user.profileId }
      : { patient_id: req.user.profileId };
    const sort = isDoctor
      ? { appointment_date: -1, priority: 1, arrival_time: 1 }
      : { appointment_date: -1, arrival_time: 1 };
    const appointments = await Appointment.find(filter)
      .populate('patient_id', 'name')
      .populate('doctor_id', 'name specialization')
      .sort(sort);

    console.log(`  ✓ Fetched ${appointments.length} appointments for ${req.user.role}`);
    res.json(appointments.map(appointment => appointmentResponse(appointment, !isDoctor)));
  } catch (err) {
    console.error('  ✗ Error fetching appointments:', err.message);
    res.status(500).json({ message: 'Error fetching appointments.' });
  }
});

// POST /api/appointments - Patient books an appointment
router.post('/', verifyToken, authorizeRole('patient'), async (req, res) => {
  try {
    const {
      doctor_id,
      appointment_date,
      arrival_time,
      estimated_service_time,
      appointment_type,
      reason
    } = req.body;

    if (!doctor_id || !appointment_date || !arrival_time) {
      return res.status(400).json({ message: 'Doctor, date, and arrival time are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(doctor_id)) {
      return res.status(400).json({ message: 'Choose a valid doctor.' });
    }

    const doctorExists = await Doctor.exists({ _id: doctor_id });
    if (!doctorExists) {
      return res.status(400).json({ message: 'Choose a valid doctor.' });
    }

    const serviceTime = estimated_service_time || 15;

    const existing = await Appointment.exists({
      doctor_id,
      appointment_date,
      arrival_time,
      status: { $ne: 'completed' }
    });

    if (existing) {
      return res.status(409).json({ message: 'This time slot is already booked. Please choose a different time.' });
    }

    const appointment = await Appointment.create({
      patient_id: req.user.profileId,
      doctor_id,
      appointment_date,
      arrival_time,
      estimated_service_time: serviceTime,
      appointment_type,
      status: 'waiting',
      reason
    });

    publishNotification({
      roles: ['doctor', 'admin'],
      type: 'appointment-created',
      message: `New ${appointment_type} appointment booked for ${appointment_date}.`
    });
    console.log(`  ✓ New ${appointment_type} appointment #${appointment.id} booked`);
    res.status(201).json({
      message: 'Appointment booked successfully',
      appointmentId: appointment.id
    });
  } catch (err) {
    console.error('  ✗ Error booking appointment:', err.message);
    res.status(500).json({ message: 'Error booking appointment.' });
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Appointment not found or access denied.' });
    }

    const appointment = await Appointment.findOne({ _id: id, doctor_id: req.user.profileId });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or access denied.' });
    }
    const patient = await Patient.findById(appointment.patient_id).select('user_id');
    if (!patient) {
      return res.status(404).json({ message: 'Appointment patient not found.' });
    }

    appointment.status = status;
    await appointment.save();

    publishNotification({
      userId: patient.user_id.toString(),
      type: 'appointment-status',
      message: `Your appointment status changed to ${status}.`
    });
    console.log(`  ✓ Appointment #${id} → ${status}`);
    res.json({ message: `Appointment status updated to ${status}` });
  } catch (err) {
    console.error('  ✗ Error updating status:', err.message);
    res.status(500).json({ message: 'Error updating appointment status.' });
  }
});

module.exports = router;
