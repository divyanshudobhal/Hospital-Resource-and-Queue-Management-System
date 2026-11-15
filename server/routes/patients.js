const express = require('express');
const { Patient } = require('../db');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

function patientResponse(patient) {
  const result = {
    id: patient.id,
    user_id: patient.user_id.id,
    name: patient.name,
    age: patient.age ?? null,
    gender: patient.gender ?? null,
    phone: patient.phone ?? null,
    blood_group: patient.blood_group ?? null,
    username: patient.user_id.username
  };
  return result;
}

// GET /api/patients - Doctor only: fetch all patients
router.get('/', verifyToken, authorizeRole('doctor'), async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate('user_id', 'username')
      .sort({ name: 1 });

    console.log(`  ✓ Fetched ${patients.length} patients`);
    res.json(patients.map(patientResponse));
  } catch (err) {
    console.error('  ✗ Error fetching patients:', err.message);
    res.status(500).json({ message: 'Error fetching patients.' });
  }
});

// GET /api/patients/profile - Patient gets own profile
router.get('/profile', verifyToken, authorizeRole('patient'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.profileId)
      .populate('user_id', 'username');

    if (!patient) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    res.json(patientResponse(patient));
  } catch (err) {
    console.error('  ✗ Error fetching profile:', err.message);
    res.status(500).json({ message: 'Error fetching profile.' });
  }
});

module.exports = router;
