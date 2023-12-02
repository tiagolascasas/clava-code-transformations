#include <stdio.h>

void incorrect(int A[100], int *i)
{
    for (*i = 0; *i < 100; *i++)
    {
        A[*i] = *i;
    }
}

void correct_unary(int A[100], int *i)
{
    for (*i = 0; *i < 100; (*i)++)
    {
        A[*i] = *i;
    }
}

void correct_binary(int A[100], int *i)
{
    for (*i = 0; *i < 100; *i = *i + 1)
    {
        A[*i] = *i;
    }
}

int main()
{
    int A[100];
    int i;
    incorrect(A, &i);
    printf("%d %d %d\n", A[0], A[1], A[2]); // CHECK: 0 0 0
    int B[100];
    int j;
    correct_unary(B, &j);
    printf("%d %d %d\n", B[0], B[1], B[2]); // CHECK: 0 1 2
    int C[100];
    int k;
    correct_binary(C, &k);
    printf("%d %d %d\n", C[0], C[1], C[2]); // CHECK: 0 1 2
    return 0;
}