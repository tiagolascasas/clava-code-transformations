# clava-code-transformations

Code transformations and optimizations for the [Clava C/C++ to C/C++ Source-to-Source compiler](https://github.com/specs-feup/clava):

**ArrayFlattener** - converts N-dimensional arrays into 1D.

**FoldingPropagationCombiner** - iteratively alternates between applying **ConstantFolder** and **ConstantPropagator** until no more optimization opportunities arise.

**Outliner** - takes in a code region and extracts it onto its own function. It works with any region, as long as the starting and ending points are in the same scope, and as long as there are no unstructured jumps to and from the region (i.e., goto-label jumps).

**StructDecomposer** - decomposes a struct variable/ref into separate variables/refs representing their fields, updating function calls and all expressions accordingly:

```C
// before
typedef struct {
    float x;
    float y;
} Point2D;

void foo(Point2D point)  { /*...*/ }

void bar(Point2D *point)  { /*...*/ }

int main() {
    Point2D point;
    point.x = 1.0;
    point.y = 2.0;
    foo(point);
    bar(&point);
}

// after
void foo(float point_x, float point_y) { /*...*/ }

void bar(float *point_x, float *point_y) { /*...*/ }

int main() {
    float point_x = 1.0;
    float point_y = 2.0;
    foo(point_x, point_y);
    bar(&point_x, &point_y);
}
```

**SwitchToIf** - converts switch-case statements into a chain of if-statements.

**TripCountCalculator** - calculates, within the limits of static analysis, the number of iterations of a loop.

**UnaryToBinaryConverter** - converts unary arithmetic operations, e.g., i++, into a binary operation, e.g., i = i + 1.

**Voidifier** - takes in a function with a return value, and changes it so that the function returns void. It does this by adding in an additional pointer argument to the function, pointing to a new local variable where the result of the function can be stored. It then uses that variable in lieu of the return value of the function. Example:

```C
// before
int foo(int a, int b) {
    int c = a * a + 2 * b;
    return c;
}

void bar() {
    int res = foo(100, 200);
}

// after
void foo(int a, int b, int *rtr_val) {
    int c = a * a + 2 * b;
    (*rtr_val) = c;
}

void bar() {
    int res;
    foo(100, 200, &res);
}
```

### How do I use these in Clava?

1. Clone the repository
2. Add the repository as an extra include either on your Clava config file, or as a command-line argument, e.g., `--includes /path/to/repo/clava-code-transformations/src`. Make sure you include the "src" folder, and not the root of the repository!
3. Use the transformations in your own code by importing them using `laraImport("clava.code.<TRANSFORM>");`, e.g., use `laraImport("clava.code.Outliner");` to import and use the Outliner.

### How do I test these transformations?

Each transformation has an associated test (runnable by a script) with its own input source files.
