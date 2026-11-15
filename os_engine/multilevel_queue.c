#include <stdio.h>

#define MAX_PROCESSES 100

typedef struct {
    int pid;
    int arrival;
    int burst;
    int queue;
    int completed;
    int start;
    int completion;
    int turnaround;
    int waiting;
} Process;

int main(void) {
    Process p[MAX_PROCESSES];
    int order[MAX_PROCESSES];
    int n, i, completed = 0, time = 0;
    double total_wait = 0.0, total_turnaround = 0.0;

    printf("HOSPITAL CPU SCHEDULING - MULTILEVEL QUEUE (C)\n");
    printf("Queue 0 is high priority (emergency); queue 1 is regular.\n");
    printf("Enter number of processes (1-%d): ", MAX_PROCESSES);
    if (scanf("%d", &n) != 1 || n < 1 || n > MAX_PROCESSES) {
        fprintf(stderr, "Invalid number of processes.\n");
        return 1;
    }

    for (i = 0; i < n; i++) {
        p[i].pid = i + 1;
        p[i].completed = 0;
        printf("Process P%d arrival time, burst time, queue (0 or 1): ", p[i].pid);
        if (scanf("%d %d %d", &p[i].arrival, &p[i].burst, &p[i].queue) != 3 ||
            p[i].arrival < 0 || p[i].burst <= 0 ||
            (p[i].queue != 0 && p[i].queue != 1)) {
            fprintf(stderr, "Arrival must be >= 0, burst > 0, and queue must be 0 or 1.\n");
            return 1;
        }
    }

    while (completed < n) {
        int selected = -1;
        for (i = 0; i < n; i++) {
            if (p[i].completed || p[i].arrival > time) continue;
            if (selected == -1 || p[i].queue < p[selected].queue ||
                (p[i].queue == p[selected].queue && p[i].arrival < p[selected].arrival) ||
                (p[i].queue == p[selected].queue && p[i].arrival == p[selected].arrival &&
                 p[i].pid < p[selected].pid)) {
                selected = i;
            }
        }

        if (selected == -1) {
            int next_arrival = -1;
            for (i = 0; i < n; i++) {
                if (!p[i].completed &&
                    (next_arrival == -1 || p[i].arrival < next_arrival)) {
                    next_arrival = p[i].arrival;
                }
            }
            time = next_arrival;
            continue;
        }

        p[selected].start = time;
        p[selected].completion = time + p[selected].burst;
        p[selected].turnaround = p[selected].completion - p[selected].arrival;
        p[selected].waiting = p[selected].turnaround - p[selected].burst;
        p[selected].completed = 1;
        time = p[selected].completion;
        order[completed] = selected;
        completed++;
        total_wait += p[selected].waiting;
        total_turnaround += p[selected].turnaround;
    }

    printf("\n%-8s %-8s %-8s %-8s %-8s %-8s %-8s %-8s\n",
           "Process", "Queue", "Arrival", "Burst", "Start", "Complete", "Waiting", "TAT");
    for (i = 0; i < n; i++) {
        printf("P%-7d %-8s %-8d %-8d %-8d %-8d %-8d %-8d\n",
               p[i].pid, p[i].queue == 0 ? "High" : "Regular", p[i].arrival,
               p[i].burst, p[i].start, p[i].completion, p[i].waiting,
               p[i].turnaround);
    }

    printf("\nAverage waiting time: %.2f\n", total_wait / n);
    printf("Average turnaround time: %.2f\n", total_turnaround / n);
    printf("Gantt order: ");
    for (i = 0; i < n; i++) {
        printf("P%d%s", p[order[i]].pid, i == n - 1 ? "\n" : " -> ");
    }
    return 0;
}
