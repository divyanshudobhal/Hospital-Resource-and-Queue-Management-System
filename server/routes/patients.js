const express = require('express');
const pool = require('../db');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/patients - Doctor only: fetch all patients
router.get('/', verifyToken, authorizeRole('doctor'), async (req, res) => {
  try {
    const [patients] = await pool.query(
      `SELECT p.id, p.name, p.age, p.gender, p.phone, p.blood_group, u.username
       FROM patients p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.name`
    );

    console.log(`  ✓ Fetched ${patients.length} patients`);
    res.json(patients);
  } catch (err) {
    console.error('  ✗ Error fetching patients:', err.message);
    res.status(500).json({ message: 'Error fetching patients.' });
  }
});

// GET /api/patients/profile - Patient gets own profile
router.get('/profile', verifyToken, authorizeRole('patient'), async (req, res) => {
  try {
    const [patients] = await pool.query(
      `SELECT p.*, u.username
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [req.user.profileId]
    );

    if (patients.length === 0) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    res.json(patients[0]);
  } catch (err) {
    console.error('  ✗ Error fetching profile:', err.message);
    res.status(500).json({ message: 'Error fetching profile.' });
  }
});

module.exports = router;
