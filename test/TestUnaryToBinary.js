"use strict";

laraImport("clava.code.UnaryToBinaryConverter");
laraImport("weaver.Query");

function main() {

    const ubc = new UnaryToBinaryConverter(false);
    for (const op of Query.search("unaryOp")) {
        ubc.convert(op);
    }
}

main();