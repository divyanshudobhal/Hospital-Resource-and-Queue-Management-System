const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Doctor, Patient } = require('../db');

const router = express.Router();

// POST /api/auth/signup - create a patient login and profile
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

  let user;
  let patient;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({ username, password_hash: passwordHash, role: 'patient' });
    patient = await Patient.create({
      user_id: user._id,
      name,
      age: age === null ? undefined : age,
      gender: gender || undefined,
      phone: phone || undefined,
      blood_group: bloodGroup || undefined
    });

    const userPayload = { id: user.id, username, role: 'patient', profileId: patient.id };
    const token = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '8h' });
    console.log(`  ✓ Patient account created: ${username}`);
    res.status(201).json({ message: 'Account created successfully.', token, user: userPayload });
  } catch (err) {
    if (patient) await Patient.deleteOne({ _id: patient._id });
    if (user) await User.deleteOne({ _id: user._id });
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That username is already taken.' });
    }
    console.error('  ✗ Signup error:', err.message);
    res.status(500).json({ message: 'Could not create your account. Please try again.' });
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
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Get role-specific profile ID (doctor_id or patient_id)
    let profileId;
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user_id: user._id }).select('_id');
      profileId = doctor ? doctor.id : null;
    } else if (user.role === 'patient') {
      const patient = await Patient.findOne({ user_id: user._id }).select('_id');
      profileId = patient ? patient.id : null;
    } else {
      profileId = null;
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
