#include <cstdio>
#include "config.h"
void checksum(int buf[262144], int *rtr_val) {
   int n = 0;
   for(int i = 0; i < 512; i++) {
      for(int j = 0; j < 512; j++) {
         n += buf[512 * i + j];
      }
   }
   printf("Checksum %s", n == 259845 ? "SUCCESS" : "FAILURE");
   printf(" (actual: %d, expected: %d)\n", n, 259845);
   *rtr_val = n;
   
   return;
}

void output_dsp(int buf[262144], char *name) {
   FILE *file = fopen(name, "w");
   for(int i = 0; i < 262144 - 1; i++) {
      fprintf(file, "%d,", buf[i]);
   }
   fprintf(file, "%d", buf[262144 - 1]);
   fclose(file);
}

void output_dsp_rgb(int buf[786432], char *name) {
   FILE *file = fopen(name, "w");
   for(int i = 0; i < 262144 * 3 - 1; i++) {
      fprintf(file, "%d,", buf[i]);
   }
   fprintf(file, "%d", buf[262144 * 3 - 1]);
   fclose(file);
}
