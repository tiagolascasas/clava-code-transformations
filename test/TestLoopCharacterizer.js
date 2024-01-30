"use strict";

laraImport("clava.code.LoopCharacterizer");
laraImport("weaver.Query");

function main() {

    for (const loop of Query.search("loop")) {
        const chr = LoopCharacterizer.characterize(loop);

        const line = loop.line;
        const count = chr.tripCount;
        println(`${chr.inductionVar}|${chr.boundVar}|${chr.incrementVar} : ${chr.initialVal}|${chr.bound}|${chr.increment}|${chr.op}`);

        if (count > -1) {
            println(`Loop in line ${line}: ${count} iterations`);
        } else {
            println(`Loop in line ${line}: unknown number of iterations`);
        }
        println("---------------------------------");
    }
}

main();
