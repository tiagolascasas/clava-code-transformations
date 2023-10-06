#ifndef _UTIL_H_
#define _UTIL_H_

#include "config.h"
#pragma once

void input_dsp(int buf[786432]);
void checksum(int buf[262144], int *rtr_val);
void output_dsp(int buf[262144], char *name);
void output_dsp_rgb(int buf[786432], char *name);
#endif
