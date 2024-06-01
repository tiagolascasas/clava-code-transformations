"use strict";

laraImport("clava.code.StructDecomposer");
laraImport("weaver.Query");
laraImport("../test/AstDumper");

function main() {
    const dumper = new AstDumper();
    println(dumper.dump());

    const decomp = new StructDecomposer();
    decomp.decomposeAll();
    //decomp.decomposeByName("Point2D");
}

main();