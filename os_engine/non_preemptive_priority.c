#include <stdio.h>

#define MAX_PROCESSES 100

typedef struct {
    int pid;
    int arrival;
    int burst;
    int priority;
    int completed;
    int start;
    int completion;
    int turnaround;
    int waiting;
    int response;
} Process;

int main(void) {
    Process p[MAX_PROCESSES];
    int n, i, completed = 0, time = 0;
    double total_wait = 0.0, total_turnaround = 0.0;

    printf("HOSPITAL CPU SCHEDULING - NON-PREEMPTIVE PRIORITY (C)\n");
    printf("Lower priority number means higher priority.\n");
    printf("Enter number of processes (1-%d): ", MAX_PROCESSES);
    if (scanf("%d", &n) != 1 || n < 1 || n > MAX_PROCESSES) {
        fprintf(stderr, "Invalid number of processes.\n");
        return 1;
    }

    for (i = 0; i < n; i++) {
        p[i].pid = i + 1;
        p[i].completed = 0;
        printf("Process P%d arrival time, burst time, priority: ", p[i].pid);
        if (scanf("%d %d %d", &p[i].arrival, &p[i].burst, &p[i].priority) != 3 ||
            p[i].arrival < 0 || p[i].burst <= 0 || p[i].priority < 0) {
            fprintf(stderr, "Arrival must be >= 0, burst > 0, priority >= 0.\n");
            return 1;
        }
    }

    while (completed < n) {
        int selected = -1;

        for (i = 0; i < n; i++) {
            if (p[i].completed || p[i].arrival > time) continue;
            if (selected == -1 ||
                p[i].priority < p[selected].priority ||
                (p[i].priority == p[selected].priority && p[i].arrival < p[selected].arrival) ||
                (p[i].priority == p[selected].priority && p[i].arrival == p[selected].arrival && p[i].pid < p[selected].pid)) {
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
        p[selected].response = p[selected].start - p[selected].arrival;
        p[selected].completion = p[selected].start + p[selected].burst;
        p[selected].turnaround = p[selected].completion - p[selected].arrival;
        p[selected].waiting = p[selected].turnaround - p[selected].burst;
        time = p[selected].completion;
        p[selected].completed = 1;
        completed++;
        total_wait += p[selected].waiting;
        total_turnaround += p[selected].turnaround;
    }

    printf("\n%-8s %-8s %-8s %-8s %-8s %-8s %-8s\n",
           "Process", "Arrival", "Burst", "Priority", "Complete", "Waiting", "TAT");
    for (i = 0; i < n; i++) {
        printf("P%-7d %-8d %-8d %-8d %-8d %-8d %-8d\n",
               p[i].pid, p[i].arrival, p[i].burst, p[i].priority,
               p[i].completion, p[i].waiting, p[i].turnaround);
    }

    printf("\nAverage waiting time: %.2f\n", total_wait / n);
    printf("Average turnaround time: %.2f\n", total_turnaround / n);
    printf("Gantt order: ");
    {
        int order[MAX_PROCESSES], count = 0;
        /* Reconstruct execution order from start times for display. */
        for (i = 0; i < n; i++) {
            int pos = count;
            while (pos > 0 && p[order[pos - 1]].start > p[i].start) {
                order[pos] = order[pos - 1];
                pos--;
            }
            order[pos] = i;
            count++;
        }
        for (i = 0; i < count; i++) printf("P%d%s", p[order[i]].pid, i == count - 1 ? "\n" : " -> ");
    }
    return 0;
}
