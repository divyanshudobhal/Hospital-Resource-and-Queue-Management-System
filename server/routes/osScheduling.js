const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { Appointment } = require('../db');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();
const engineDir = path.resolve(__dirname, '../../os_engine');
const MAX_PROCESS_VALUE = 1000000;
const programSources = {
  fcfs: 'fcfs.c',
  priority: 'non_preemptive_priority.c',
  sjf: 'sjf.c',
  round_robin: 'round_robin.c',
  multilevel_queue: 'multilevel_queue.c'
};

function invalidAppointment(message) {
  const error = new Error(message);
  error.status = 422;
  return error;
}

function appointmentArrivalMinute(appointment) {
  const date = String(appointment.appointment_date || '').slice(0, 10);
  const time = String(appointment.arrival_time || '');
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(time);
  const dayStart = Date.parse(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !timeMatch ||
      !Number.isFinite(dayStart) || new Date(dayStart).toISOString().slice(0, 10) !== date) {
    throw invalidAppointment(`Appointment ${appointment._id} has an invalid date or arrival time.`);
  }
  const minuteOfDay = Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
  return Math.floor(dayStart / 60000) + minuteOfDay;
}

function createProcesses(appointments) {
  if (appointments.length > 100) {
    const error = new Error('Scheduling supports at most 100 waiting appointments at a time.');
    error.status = 400;
    throw error;
  }

  const records = appointments.map(appointment => {
    const burst = appointment.estimated_service_time;
    const priority = appointment.priority;
    if (!Number.isInteger(burst) || burst < 1 || burst > MAX_PROCESS_VALUE ||
        !Number.isInteger(priority) || priority < 0 || priority > MAX_PROCESS_VALUE ||
        !['emergency', 'regular'].includes(appointment.appointment_type)) {
      throw invalidAppointment(`Appointment ${appointment._id} has invalid service time, priority, or type data.`);
    }
    return {
      arrivalMinute: appointmentArrivalMinute(appointment),
      burst,
      priority,
      queue: appointment.appointment_type === 'emergency' ? 0 : 1
    };
  });
  const firstArrival = Math.min(...records.map(process => process.arrivalMinute));
  return records.map(process => ({
    arrival: process.arrivalMinute - firstArrival,
    burst: process.burst,
    priority: process.priority,
    queue: process.queue
  }));
}

function validateProcesses(processes, extraField) {
  if (!Array.isArray(processes) || processes.length < 1 || processes.length > 100) {
    return 'No waiting appointments found, or the queue exceeds 100 appointments.';
  }
  for (let i = 0; i < processes.length; i += 1) {
    const p = processes[i];
    if (!p || !Number.isInteger(p.arrival) || p.arrival < 0 ||
        !Number.isInteger(p.burst) || p.burst <= 0 ||
        p.arrival > MAX_PROCESS_VALUE || p.burst > MAX_PROCESS_VALUE ||
        (extraField === 'priority' && (!Number.isInteger(p.priority) || p.priority < 0 || p.priority > MAX_PROCESS_VALUE)) ||
        (extraField === 'queue' && ![0, 1].includes(p.queue))) {
      const requirements = extraField === 'priority'
        ? `arrival and priority must be between 0 and ${MAX_PROCESS_VALUE}; burst must be between 1 and ${MAX_PROCESS_VALUE}`
        : extraField === 'queue'
          ? `arrival must be between 0 and ${MAX_PROCESS_VALUE}; burst must be between 1 and ${MAX_PROCESS_VALUE}; queue must be 0 or 1`
          : `arrival must be between 0 and ${MAX_PROCESS_VALUE}; burst must be between 1 and ${MAX_PROCESS_VALUE}`;
      return `Invalid values for P${i + 1}: ${requirements}.`;
    }
  }
  return null;
}

function runProgram(programName, input) {
  const executableName = process.platform === 'win32' ? `${programName}.exe` : programName;
  const executable = path.join(engineDir, executableName);
  if (!fs.existsSync(executable)) {
    const source = path.join(engineDir, programSources[programName]);
    const compiler = spawnSync(process.env.CC || 'gcc', [
      '-std=c11', '-Wall', '-Wextra', '-O2', source, '-o', executable
    ], {
      encoding: 'utf8',
      timeout: 30000,
      windowsHide: true,
      maxBuffer: 1024 * 1024
    });
    if (compiler.error || compiler.status !== 0 || !fs.existsSync(executable)) {
      const details = compiler.error
        ? compiler.error.code === 'ENOENT'
          ? 'GCC was not found. Install a GCC toolchain or compile the scheduler manually.'
          : compiler.error.message
        : (compiler.stderr || compiler.stdout || 'Compiler did not produce an executable.').trim();
      const err = new Error(`Could not compile ${programSources[programName]}: ${details}`);
      err.status = 500;
      throw err;
    }
    console.log(`[Terminal scheduler build] Compiled ${programSources[programName]}`);
  }

  const result = spawnSync(executable, [], {
    input,
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
    maxBuffer: 1024 * 1024
  });
  if (result.error) {
    const message = result.error.code === 'ENOENT'
      ? `Scheduler executable not found: ${executableName}. Compile os_engine/${programName}.c before starting the server.`
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
  console.log(`\n[Terminal scheduler: ${programName}]\n${result.stdout.trimEnd()}\n`);
  return result.stdout;
}

const algorithms = {
  fcfs: {
    name: 'FCFS',
    program: 'fcfs',
    input: processes => `${processes.length}\n${processes.map(p => `${p.arrival} ${p.burst}`).join('\n')}\n`
  },
  priority: {
    name: 'Non-preemptive Priority',
    program: 'priority',
    extraField: 'priority',
    input: processes => `${processes.length}\n${processes.map(p => `${p.arrival} ${p.burst} ${p.priority}`).join('\n')}\n`
  },
  sjf: {
    name: 'Non-preemptive SJF',
    program: 'sjf',
    input: processes => `${processes.length}\n${processes.map(p => `${p.arrival} ${p.burst}`).join('\n')}\n`
  },
  'round-robin': {
    name: 'Round Robin',
    program: 'round_robin',
    input: (processes, quantum) => `${processes.length} ${quantum}\n${processes.map(p => `${p.arrival} ${p.burst}`).join('\n')}\n`
  },
  multilevel: {
    name: 'Multilevel Queue',
    program: 'multilevel_queue',
    extraField: 'queue',
    input: processes => `${processes.length}\n${processes.map(p => `${p.arrival} ${p.burst} ${p.queue}`).join('\n')}\n`
  }
};

router.post('/:algorithm', verifyToken, authorizeRole('doctor'), async (req, res) => {
  const algorithm = algorithms[req.params.algorithm];
  if (!algorithm) return res.status(404).json({ error: 'Unknown scheduling algorithm.' });

  const quantum = req.body && req.body.quantum;
  if (req.params.algorithm === 'round-robin' &&
      (!Number.isInteger(quantum) || quantum < 1 || quantum > MAX_PROCESS_VALUE)) {
    return res.status(400).json({ error: `Time quantum must be between 1 and ${MAX_PROCESS_VALUE}.` });
  }

  try {
    const appointments = await Appointment.find({
      doctor_id: req.user.profileId,
      status: 'waiting'
    }).sort({ appointment_date: 1, arrival_time: 1, _id: 1 });
    if (appointments.length === 0) {
      return res.status(409).json({ error: 'No waiting appointments were found for this doctor.' });
    }

    const processes = createProcesses(appointments);
    const validationError = validateProcesses(processes, algorithm.extraField);
    if (validationError) return res.status(400).json({ error: validationError });

    if (req.params.algorithm === 'round-robin') {
      const turns = processes.reduce(
        (total, process) => total + Math.ceil(process.burst / quantum),
        0
      );
      if (turns > 10000) {
        return res.status(400).json({ error: 'Round Robin is limited to 10,000 time slices. Increase the time quantum.' });
      }
    }

    const output = runProgram(algorithm.program, algorithm.input(processes, quantum));
    return res.json({ algorithm: algorithm.name, processCount: processes.length, output });
  } catch (err) {
    console.error('  ✗ OS scheduling failed:', err.message);
    return res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
