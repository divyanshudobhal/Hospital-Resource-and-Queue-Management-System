const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// POST /api/auth/signup - create a patient login and profile in one transaction
router.post('/signup', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const age = req.body.age === '' || req.body.age == null ? null : Number(req.body.age);
  const gender = req.body.gender || null;
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : null;
  const bloodGroup = req.body.blood_group || null;

  if (!name || name.length > 100) {
    return res.status(400).json({ message: 'Enter your name (up to 100 characters).' });
  }
  if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
    return res.status(400).json({ message: 'Username must be 3–50 characters: letters, numbers, dots, underscores, or hyphens.' });
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and no more than 72 bytes.' });
  }
  if (age !== null && (!Number.isInteger(age) || age < 1 || age > 120)) {
    return res.status(400).json({ message: 'Age must be a whole number between 1 and 120.' });
  }
  if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
    return res.status(400).json({ message: 'Choose a valid gender option.' });
  }
  if (phone && phone.length > 20) {
    return res.status(400).json({ message: 'Phone number must be 20 characters or fewer.' });
  }
  if (bloodGroup && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bloodGroup)) {
    return res.status(400).json({ message: 'Choose a valid blood group.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const passwordHash = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, \'patient\')',
      [username, passwordHash]
    );
    const [patientResult] = await connection.query(
      `INSERT INTO patients (user_id, name, age, gender, phone, blood_group)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userResult.insertId, name, age, gender, phone || null, bloodGroup]
    );

    await connection.commit();

    const user = { id: userResult.insertId, username, role: 'patient', profileId: patientResult.insertId };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '8h' });
    console.log(`  ✓ Patient account created: ${username}`);
    res.status(201).json({ message: 'Account created successfully.', token, user });
  } catch (err) {
    if (connection) await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'That username is already taken.' });
    }
    console.error('  ✗ Signup error:', err.message);
    res.status(500).json({ message: 'Could not create your account. Please try again.' });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const { password } = req.body;

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
