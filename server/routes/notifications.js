const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { addNotificationClient } = require('../services/notifications');

const router = express.Router();

router.get('/stream', verifyToken, (req, res) => {
  addNotificationClient(req.user, res);
});

module.exports = router;
