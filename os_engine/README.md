# C CPU Scheduling additions

Copy the `os_engine` folder into the root of your Hospital Resource and Queue Management System project.

## Compile in MSYS2 UCRT64

From the project root:

```bash
cd os_engine
gcc -std=c11 -Wall -Wextra fcfs.c -o fcfs.exe
gcc -std=c11 -Wall -Wextra non_preemptive_priority.c -o priority.exe
```

## Run

```bash
./fcfs.exe
./priority.exe
```

Inputs:
- FCFS: enter process count, then each process's arrival time and burst time.
- Non-preemptive Priority: enter process count, then each process's arrival time, burst time, and priority.
- Lower priority number means higher priority.
- Both programs handle arrival times and idle CPU time.

These are standalone C demonstrations. The existing React SchedulingPanel is JavaScript-based; wiring the C executables into the website through the Node.js backend is a separate integration step.
