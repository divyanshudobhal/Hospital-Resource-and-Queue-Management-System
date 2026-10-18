const express = require('express');
const path = require('path');
const { spawnSync } = require('child_process');

const router = express.Router();
const engineDir = path.resolve(__dirname, '../../os_engine');

function validateProcesses(body, needsPriority) {
  const { processes } = body || {};
  if (!Array.isArray(processes) || processes.length < 1 || processes.length > 100) {
    return 'Provide between 1 and 100 processes.';
  }
  for (let i = 0; i < processes.length; i += 1) {
    const p = processes[i];
    if (!p || !Number.isInteger(p.arrival) || p.arrival < 0 ||
        !Number.isInteger(p.burst) || p.burst <= 0 ||
        (needsPriority && (!Number.isInteger(p.priority) || p.priority < 0))) {
      return `Invalid values for P${i + 1}. Arrival must be >= 0, burst must be > 0${needsPriority ? ', and priority must be >= 0' : ''}.`;
    }
  }
  return null;
}

function runProgram(exeName, input) {
  const executable = path.join(engineDir, exeName);
  const result = spawnSync(executable, [], {
    input,
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
    maxBuffer: 1024 * 1024
  });
  if (result.error) {
    const message = result.error.code === 'ENOENT'
      ? `Executable not found: ${exeName}. Compile the C source in os_engine first.`
      : result.error.message;
    const err = new Error(message);
    err.status = 500;
    throw err;
  }
  if (result.status !== 0) {
    const err = new Error((result.stderr || result.stdout || 'C scheduling program failed.').trim());
    err.status = 400;
    throw err;
  }
  return result.stdout;
}

router.post('/fcfs', (req, res) => {
  const validationError = validateProcesses(req.body, false);
  if (validationError) return res.status(400).json({ error: validationError });
  const input = `${req.body.processes.length}\n${req.body.processes.map(p => `${p.arrival} ${p.burst}`).join('\n')}\n`;
  try {
    return res.json({ algorithm: 'FCFS', output: runProgram('fcfs.exe', input) });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/priority', (req, res) => {
  const validationError = validateProcesses(req.body, true);
  if (validationError) return res.status(400).json({ error: validationError });
  const input = `${req.body.processes.length}\n${req.body.processes.map(p => `${p.arrival} ${p.burst} ${p.priority}`).join('\n')}\n`;
  try {
    return res.json({ algorithm: 'Non-preemptive Priority', output: runProgram('priority.exe', input) });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
