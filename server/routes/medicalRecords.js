const express = require('express');
const mongoose = require('mongoose');
const { MedicalRecord, Patient, Appointment } = require('../db');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { publishNotification } = require('../services/notifications');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    if (!['doctor', 'patient'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const filter = req.user.role === 'doctor'
      ? { doctor_id: req.user.profileId }
      : { patient_id: req.user.profileId };
    const records = await MedicalRecord.find(filter)
      .populate('patient_id', 'name')
      .populate('doctor_id', 'name')
      .populate('appointment_id', 'appointment_date')
      .sort({ created_at: -1 });

    res.json(records.map(record => ({
      id: record.id,
      diagnosis: record.diagnosis,
      treatment: record.treatment || '',
      notes: record.notes || '',
      created_at: record.created_at,
      patient_id: record.patient_id.id,
      patient_name: record.patient_id.name,
      doctor_name: record.doctor_id.name,
      appointment_date: record.appointment_id ? record.appointment_id.appointment_date : null
    })));
  } catch (err) {
    console.error('  ✗ Error fetching medical records:', err.message);
    res.status(500).json({ message: 'Error fetching medical records.' });
  }
});

router.post('/', verifyToken, authorizeRole('doctor'), async (req, res) => {
  try {
    const { patient_id, appointment_id, diagnosis, treatment, notes } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(patient_id)) {
      return res.status(400).json({ message: 'Choose a valid patient.' });
    }
    if (typeof diagnosis !== 'string' || !diagnosis.trim() || diagnosis.trim().length > 200) {
      return res.status(400).json({ message: 'Diagnosis is required and must be 200 characters or fewer.' });
    }
    if ((treatment != null && (typeof treatment !== 'string' || treatment.length > 1000)) ||
        (notes != null && (typeof notes !== 'string' || notes.length > 2000))) {
      return res.status(400).json({ message: 'Treatment or notes exceed the allowed length.' });
    }

    const patient = await Patient.findById(patient_id);
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    const assigned = await Appointment.exists({
      patient_id,
      doctor_id: req.user.profileId
    });
    if (!assigned) {
      return res.status(403).json({ message: 'You can only add records for your assigned patients.' });
    }

    let appointment;
    if (appointment_id) {
      if (!mongoose.Types.ObjectId.isValid(appointment_id)) {
        return res.status(400).json({ message: 'Choose a valid appointment.' });
      }
      appointment = await Appointment.findOne({
        _id: appointment_id,
        patient_id,
        doctor_id: req.user.profileId
      });
      if (!appointment) {
        return res.status(403).json({ message: 'That appointment is not assigned to you.' });
      }
    }

    const record = await MedicalRecord.create({
      patient_id,
      doctor_id: req.user.profileId,
      appointment_id: appointment ? appointment._id : undefined,
      diagnosis: diagnosis.trim(),
      treatment: typeof treatment === 'string' ? treatment.trim() : '',
      notes: typeof notes === 'string' ? notes.trim() : ''
    });

    publishNotification({
      userId: patient.user_id.toString(),
      type: 'medical-record-created',
      message: 'A new medical record is available in your patient portal.'
    });
    res.status(201).json({ message: 'Medical record created.', id: record.id });
  } catch (err) {
    console.error('  ✗ Error creating medical record:', err.message);
    res.status(500).json({ message: 'Error creating medical record.' });
  }
});

module.exports = router;
