"use strict";

laraImport("clava.code.TripCountCalculator");
laraImport("weaver.Query");

function main() {

    for (const loop of Query.search("loop")) {
        const characterization = TripCountCalculator.calculate(loop);

        const line = loop.line;
        const count = characterization.tripCount;

        if (count > -1) {
            println(`Loop in line ${line}: ${count} iterations`);
        } else {
            println(`Loop in line ${line}: unknown number of iterations`);
        }
        println("---------------------------------");
    }
}

main();
