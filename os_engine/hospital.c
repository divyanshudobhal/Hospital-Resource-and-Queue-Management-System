#include <stdio.h>
#include <string.h>

int main() {
    char names[100][50];
    int n, beds = 20, served = 0;
    printf("Kitne patients? ");
    scanf("%d", &n);
    for(int i=0;i<n;i++){
        printf("Patient %d ka naam: ", i+1);
        scanf("%s", names[i]);
    }
    printf("\n--- FCFS Order ---\n");
    for(int i=0;i<n;i++){
        printf("Token %d - %s -> Dr. Sharma | Bed Allocated | Beds Left: %d\n", i+1, names[i], --beds);
        served++;
    }
    printf("\nTotal Served: %d\n", served);
    return 0;
}