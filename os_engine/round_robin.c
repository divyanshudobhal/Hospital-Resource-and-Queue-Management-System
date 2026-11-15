#include <stdio.h>

#define MAX_PROCESSES 100
#define MAX_TURNS 10000

typedef struct {
    int pid;
    int arrival;
    int burst;
    int remaining;
    int completion;
} Process;

int main(void) {
    Process p[MAX_PROCESSES];
    int order[MAX_TURNS];
    int ready[MAX_PROCESSES + 1];
    int n, quantum, i, next_arrival = 0, completed = 0, time = 0;
    int head = 0, tail = 0, count = 0, turn_count = 0;
    double total_wait = 0.0, total_turnaround = 0.0;

    printf("HOSPITAL CPU SCHEDULING - ROUND ROBIN (C)\n");
    printf("Enter number of processes (1-%d) and time quantum: ", MAX_PROCESSES);
    if (scanf("%d %d", &n, &quantum) != 2 || n < 1 ||
        n > MAX_PROCESSES || quantum < 1) {
        fprintf(stderr, "Process count must be 1-%d and quantum must be > 0.\n", MAX_PROCESSES);
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
        p[i].remaining = p[i].burst;
        p[i].completion = 0;
    }

    for (i = 0; i < n; i++) {
        int j;
        for (j = i + 1; j < n; j++) {
            if (p[j].arrival < p[i].arrival ||
                (p[j].arrival == p[i].arrival && p[j].pid < p[i].pid)) {
                Process tmp = p[i];
                p[i] = p[j];
                p[j] = tmp;
            }
        }
    }
    time = p[0].arrival;

    while (completed < n) {
        if (count == 0) {
            if (next_arrival < n && time < p[next_arrival].arrival) {
                time = p[next_arrival].arrival;
            }
            while (next_arrival < n && p[next_arrival].arrival <= time) {
                ready[tail] = next_arrival++;
                tail = (tail + 1) % (MAX_PROCESSES + 1);
                count++;
            }
        }

        {
            int index = ready[head];
            int slice = p[index].remaining < quantum ? p[index].remaining : quantum;
            head = (head + 1) % (MAX_PROCESSES + 1);
            count--;
            time += slice;
            p[index].remaining -= slice;
            if (turn_count >= MAX_TURNS) {
                fprintf(stderr, "Too many round-robin time slices; increase the quantum.\n");
                return 1;
            }
            order[turn_count++] = p[index].pid;

            while (next_arrival < n && p[next_arrival].arrival <= time) {
                ready[tail] = next_arrival++;
                tail = (tail + 1) % (MAX_PROCESSES + 1);
                count++;
            }

            if (p[index].remaining == 0) {
                p[index].completion = time;
                completed++;
            } else {
                ready[tail] = index;
                tail = (tail + 1) % (MAX_PROCESSES + 1);
                count++;
            }
        }
    }

    printf("\n%-8s %-8s %-8s %-8s %-8s %-8s\n",
           "Process", "Arrival", "Burst", "Complete", "Waiting", "TAT");
    for (i = 0; i < n; i++) {
        int turnaround = p[i].completion - p[i].arrival;
        int waiting = turnaround - p[i].burst;
        printf("P%-7d %-8d %-8d %-8d %-8d %-8d\n",
               p[i].pid, p[i].arrival, p[i].burst, p[i].completion,
               waiting, turnaround);
        total_wait += waiting;
        total_turnaround += turnaround;
    }

    printf("\nTime quantum: %d\n", quantum);
    printf("Average waiting time: %.2f\n", total_wait / n);
    printf("Average turnaround time: %.2f\n", total_turnaround / n);
    printf("Gantt order: ");
    for (i = 0; i < turn_count; i++) {
        printf("P%d%s", order[i], i == turn_count - 1 ? "\n" : " -> ");
    }
    return 0;
}
