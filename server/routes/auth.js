const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Find user by username
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const user = users[0];

    // Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Get role-specific profile ID (doctor_id or patient_id)
    let profileId = null;
    if (user.role === 'doctor') {
      const [doctors] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [user.id]);
      profileId = doctors.length > 0 ? doctors[0].id : null;
    } else {
      const [patients] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [user.id]);
      profileId = patients.length > 0 ? patients[0].id : null;
    }

    // Create JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      profileId: profileId
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '8h' });

    console.log(`  ✓ Login successful: ${user.username} (${user.role})`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        profileId: profileId
      }
    });
  } catch (err) {
    console.error('  ✗ Login error:', err.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;
