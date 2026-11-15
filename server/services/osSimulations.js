const RESOURCE_TYPES = ['generalBeds', 'icuBeds', 'ventilators'];

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function isCount(value) {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

function simulateResourceAllocation(body) {
  const { capacity, operations } = body || {};
  if (!capacity || RESOURCE_TYPES.some(type => !isCount(capacity[type])) ||
      !Array.isArray(operations) || operations.length < 1 || operations.length > 50) {
    throw invalid('Provide resource capacities from 0 to 100 and 1 to 50 allocation operations.');
  }

  const available = { ...capacity };
  const holdings = new Map();
  const results = [];

  operations.forEach((operation, index) => {
    if (!operation || typeof operation.process !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,20}$/.test(operation.process) ||
        !['request', 'release'].includes(operation.action) ||
        !operation.resources || RESOURCE_TYPES.some(type => !isCount(operation.resources[type]))) {
      throw invalid(`Invalid resource operation ${index + 1}.`);
    }

    const processHoldings = holdings.get(operation.process) || Object.fromEntries(RESOURCE_TYPES.map(type => [type, 0]));
    let accepted;
    if (operation.action === 'request') {
      accepted = RESOURCE_TYPES.every(type => operation.resources[type] <= available[type]);
      if (accepted) {
        RESOURCE_TYPES.forEach(type => {
          available[type] -= operation.resources[type];
          processHoldings[type] += operation.resources[type];
        });
      }
    } else {
      accepted = RESOURCE_TYPES.every(type => operation.resources[type] <= processHoldings[type]);
      if (accepted) {
        RESOURCE_TYPES.forEach(type => {
          available[type] += operation.resources[type];
          processHoldings[type] -= operation.resources[type];
        });
      }
    }
    holdings.set(operation.process, processHoldings);
    results.push({
      step: index + 1,
      process: operation.process,
      action: operation.action,
      accepted,
      available: { ...available }
    });
  });

  return { capacity, results, available };
}

function simulateBanker(body) {
  const { available, allocation, maximum } = body || {};
  if (!Array.isArray(available) || available.length < 1 || available.length > 10 ||
      !available.every(isCount) || !Array.isArray(allocation) ||
      allocation.length < 1 || allocation.length > 20 ||
      !Array.isArray(maximum) || maximum.length !== allocation.length) {
    throw invalid('Provide 1 to 20 processes and 1 to 10 resource types with non-negative integer values.');
  }
  const resourceCount = available.length;
  for (let process = 0; process < allocation.length; process += 1) {
    if (!Array.isArray(allocation[process]) || allocation[process].length !== resourceCount ||
        !allocation[process].every(isCount) || !Array.isArray(maximum[process]) ||
        maximum[process].length !== resourceCount || !maximum[process].every(isCount) ||
        maximum[process].some((value, resource) => value < allocation[process][resource])) {
      throw invalid(`Invalid allocation or maximum values for process P${process}.`);
    }
  }

  const need = maximum.map((row, process) =>
    row.map((maximumValue, resource) => maximumValue - allocation[process][resource])
  );
  const work = [...available];
  const finished = allocation.map(() => false);
  const safeSequence = [];

  while (safeSequence.length < allocation.length) {
    let found = false;
    for (let process = 0; process < allocation.length; process += 1) {
      if (finished[process] || need[process].some((value, resource) => value > work[resource])) continue;
      work.forEach((value, resource) => { work[resource] = value + allocation[process][resource]; });
      finished[process] = true;
      safeSequence.push(`P${process}`);
      found = true;
    }
    if (!found) break;
  }

  return {
    safe: safeSequence.length === allocation.length,
    safeSequence,
    blockedProcesses: finished.flatMap((done, process) => done ? [] : [`P${process}`]),
    need
  };
}

function simulateSynchronization(body) {
  const { mode, permits, processes } = body || {};
  if (!['mutex', 'semaphore'].includes(mode) ||
      !Number.isInteger(permits) || permits < 1 || permits > 20 ||
      (mode === 'mutex' && permits !== 1) ||
      !Array.isArray(processes) || processes.length < 1 || processes.length > 20) {
    throw invalid('Choose mutex (1 permit) or semaphore (1 to 20 permits) and provide 1 to 20 processes.');
  }
  if (!processes.every(process =>
    process && typeof process.id === 'string' && /^[a-zA-Z0-9_-]{1,20}$/.test(process.id) &&
    isCount(process.arrival) && Number.isInteger(process.duration) &&
    process.duration >= 1 && process.duration <= 100
  )) {
    throw invalid('Each process needs an ID, arrival from 0 to 100, and duration from 1 to 100.');
  }
  if (new Set(processes.map(process => process.id)).size !== processes.length) {
    throw invalid('Each synchronization process must have a unique ID.');
  }

  const slots = Array(permits).fill(0);
  const timeline = [...processes]
    .map((process, index) => ({ ...process, index }))
    .sort((left, right) => left.arrival - right.arrival || left.index - right.index)
    .map(process => {
      let slot = 0;
      for (let index = 1; index < slots.length; index += 1) {
        if (slots[index] < slots[slot]) slot = index;
      }
      const start = Math.max(process.arrival, slots[slot]);
      const finish = start + process.duration;
      const entry = { id: process.id, arrival: process.arrival, start, finish, waiting: start - process.arrival };
      slots[slot] = finish;
      return entry;
    });

  return { mode, permits, timeline };
}

module.exports = { simulateResourceAllocation, simulateBanker, simulateSynchronization };
