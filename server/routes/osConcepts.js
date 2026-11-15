const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const {
  simulateResourceAllocation,
  simulateBanker,
  simulateSynchronization
} = require('../services/osSimulations');

const router = express.Router();
router.use(verifyToken, authorizeRole('doctor'));

for (const [routePath, operation] of [
  ['/resources', simulateResourceAllocation],
  ['/deadlock', simulateBanker],
  ['/synchronization', simulateSynchronization]
]) {
  router.post(routePath, (req, res) => {
    try {
      res.json(operation(req.body));
    } catch (err) {
      console.error(`  ✗ OS simulation failed: ${err.message}`);
      res.status(err.status || 500).json({ message: err.message });
    }
  });
}

module.exports = router;
