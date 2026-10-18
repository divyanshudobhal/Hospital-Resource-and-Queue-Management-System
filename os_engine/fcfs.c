#include <stdio.h>
#include <stdlib.h>

#define MAX_PROCESSES 100

typedef struct {
    int pid;
    int arrival;
    int burst;
    int start;
    int completion;
    int turnaround;
    int waiting;
    int response;
} Process;

int compare_arrival(const void *a, const void *b) {
    const Process *p1 = (const Process *)a;
    const Process *p2 = (const Process *)b;
    if (p1->arrival < p2->arrival) return -1;
    if (p1->arrival > p2->arrival) return 1;
    return p1->pid - p2->pid;
}

int main(void) {
    Process p[MAX_PROCESSES];
    int n, i, time = 0;
    double total_wait = 0.0, total_turnaround = 0.0;

    printf("HOSPITAL CPU SCHEDULING - FCFS (C)\n");
    printf("Enter number of processes (1-%d): ", MAX_PROCESSES);
    if (scanf("%d", &n) != 1 || n < 1 || n > MAX_PROCESSES) {
        fprintf(stderr, "Invalid number of processes.\n");
        return 1;
    }

    for (i = 0; i < n; i++) {
        p[i].pid = i + 1;
        printf("Process P%d arrival time and burst time: ", p[i].pid);
        if (scanf("%d %d", &p[i].arrival, &p[i].burst) != 2 ||
            p[i].arrival < 0 || p[i].burst <= 0) {
            fprintf(stderr, "Arrival must be >= 0 and burst time must be > 0.\n");
            return 1;
        }
    }

    qsort(p, (size_t)n, sizeof(Process), compare_arrival);

    for (i = 0; i < n; i++) {
        if (time < p[i].arrival) time = p[i].arrival;
        p[i].start = time;
        p[i].response = p[i].start - p[i].arrival;
        p[i].completion = p[i].start + p[i].burst;
        p[i].turnaround = p[i].completion - p[i].arrival;
        p[i].waiting = p[i].turnaround - p[i].burst;
        time = p[i].completion;
        total_wait += p[i].waiting;
        total_turnaround += p[i].turnaround;
    }

    printf("\n%-8s %-8s %-8s %-8s %-8s %-8s %-8s\n",
           "Process", "Arrival", "Burst", "Start", "Complete", "Waiting", "TAT");
    for (i = 0; i < n; i++) {
        printf("P%-7d %-8d %-8d %-8d %-8d %-8d %-8d\n",
               p[i].pid, p[i].arrival, p[i].burst, p[i].start,
               p[i].completion, p[i].waiting, p[i].turnaround);
    }

    printf("\nAverage waiting time: %.2f\n", total_wait / n);
    printf("Average turnaround time: %.2f\n", total_turnaround / n);
    printf("Gantt order: ");
    for (i = 0; i < n; i++) printf("P%d%s", p[i].pid, i == n - 1 ? "\n" : " -> ");
    return 0;
}
