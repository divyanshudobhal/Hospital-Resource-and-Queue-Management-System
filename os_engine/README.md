# C CPU Scheduling Programs

The doctor dashboard sends the selected algorithm (and Round Robin time quantum, if applicable) to the Node.js API. The backend reads the authenticated doctor's waiting appointments from MongoDB, builds the C program input from those records, compiles a missing executable on first use, runs it, prints its output in the backend terminal, and returns the results to the page. Process data is not accepted from the browser. Local compilation requires GCC; Docker builds Linux executables from the C sources.

## Compile on Windows

From the project root, using MSYS2 UCRT64 or another GCC toolchain:

```powershell
gcc -std=c11 -Wall -Wextra os_engine\fcfs.c -o os_engine\fcfs.exe
gcc -std=c11 -Wall -Wextra os_engine\non_preemptive_priority.c -o os_engine\priority.exe
gcc -std=c11 -Wall -Wextra os_engine\sjf.c -o os_engine\sjf.exe
gcc -std=c11 -Wall -Wextra os_engine\round_robin.c -o os_engine\round_robin.exe
gcc -std=c11 -Wall -Wextra os_engine\multilevel_queue.c -o os_engine\multilevel_queue.exe
```

## Run a program directly

```powershell
os_engine\fcfs.exe
os_engine\priority.exe
os_engine\sjf.exe
os_engine\round_robin.exe
os_engine\multilevel_queue.exe
```

Inputs are process count and each process's arrival/burst times. Priority also takes a priority number (lower runs first), Round Robin takes a time quantum, and multilevel queue takes a queue number (0=high/emergency, 1=regular). All programs support up to 100 processes and handle idle CPU time.

The API limits Round Robin to 10,000 time slices to keep web requests responsive.
