"use strict";

laraImport("clava.code.StructDecomposer");
laraImport("weaver.Query");

function main() {
    const decomp = new StructDecomposer();
    decomp.decomposeAllEligible();
}

main();