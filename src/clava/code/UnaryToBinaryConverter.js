"use strict";

laraImport("clava.ClavaJoinPoints");

class UnaryToBinaryConverter {
    #verbose;

    constructor(verbose = false) {
        this.#verbose = verbose;
    }

    convert(unaryOp) {
        const op = unaryOp.kind;
        const parent = unaryOp.parent;
        const validOp = op == "pre_inc" || op == "pre_dec" || op == "post_inc" || op == "post_dec";

        if (!validOp) {
            this.#log("Cannot turn unary operator \"" + op + "\" into a binary operator, skipping transformation");
            return false;
        }
        if (!parent.instanceOf("exprStmt")) {
            this.#log("Unary operator \"" + op + "\" is not inside an expression statement, skipping transformation");
            return false;
        }
        println("No implementation, code = " + unaryOp.code + ", op = " + unaryOp.kind + " parent = " + unaryOp.parent.joinPointType);

        const target = unaryOp.children[0];
        const left = target.copy();
        const right = ClavaJoinPoints.integerLiteral(1);
        println("left = " + left.joinPointType + ", right = " + right.joinPointType);
        const mathOp = ClavaJoinPoints.binaryOp("+", left, right, "int");

        const assign = ClavaJoinPoints.binaryOp("=", target, mathOp);
        unaryOp.replaceWith(assign);

        return true;
    }

    #log(msg) {
        if (this.#verbose) {
            println(msg);
        }
    }
}