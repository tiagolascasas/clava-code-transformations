"use strict";

laraImport("clava.code.TripCountCalculator");
laraImport("weaver.Query");

function main() {

    const counts = {};
    for (const loop of Query.search("loop")) {
        const count = TripCountCalculator.calculate(loop);
        counts[loop.line] = count;
    }

    println("-----------------------------------\nTrip counts:");
    for (const line in counts) {
        if (counts[line] > -1) {
            println(`Loop in line ${line}: ${counts[line]} iterations`);
        } else {
            println(`Loop in line ${line}: unknown number of iterations`);
        }
    }
    println("-----------------------------------");
}

main();
