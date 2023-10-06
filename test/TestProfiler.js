"use strict";

laraImport("clava.profiling.FunctionLevelInstrumentator");
laraImport("weaver.Query");

function main() {
    const inst = new FunctionLevelInstrumentator();
    const flags = inst.instrument();

    for (const flag of flags) {
        println(flag);
    }
}

main();
