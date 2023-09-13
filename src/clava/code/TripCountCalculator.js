"use strict";

class TripCountCalculator {
    static calculate(loop) {
        if (!loop.instanceOf("loop")) {
            println("[TripCountCalculator] ERROR: argument is not a loop");
            return -1;
        }

        if (loop.kind == "for") {
            return TripCountCalculator.#handleForLoop(loop);
        }
        if (loop.kind == "while" || loop.kind == "dowhile") {
            return TripCountCalculator.#handleWhileLoop(loop);
        }
        return -1;
    }

    static #handleForLoop(loop) {
        if (loop.numChildren != 4) {
            println("[TripCountCalculator] ERROR: for-loop is non-canonical (i.e., does not have 3 statements in its header)");
            return -1;
        }
        const initExpr = loop.children[0];
        const conditionExpr = loop.children[1];
        const incrementExpr = loop.children[2];
        const body = loop.children[3];

        const initData = TripCountCalculator.#getInitializationData(initExpr);
        const initialVal = initData[0];
        const inductionVar = initData[1];

        const condData = TripCountCalculator.#getConditionData(conditionExpr);
        const bound = condData[0];
        const boundVar = condData[1];

        const incData = TripCountCalculator.#getIncrementData(incrementExpr);
        const increment = incData[0];
        const incrementVar = incData[1];

        println(`${inductionVar}|${boundVar}|${incrementVar} : ${initialVal}|${bound}|${increment}`);

        if ((inductionVar != boundVar) && (boundVar != incrementVar)) {
            // on a canonical loop, the same ind var needs to be used for all 3 statements
            return -1;
        }
        const tripCount = TripCountCalculator.#calculateTripCount(initialVal, bound, increment);

        return tripCount;
    }

    static #getInitializationData(initExpr) {
        if (initExpr.numChildren != 0 && initExpr.children[0].instanceOf("vardecl")) {
            const varDecl = initExpr.children[0];
            const name = varDecl.name;

            if (varDecl.numChildren == 1 && varDecl.children[0].instanceOf("intLiteral")) {
                const initVal = varDecl.children[0].value;
                return [initVal, name];
            }
            else {
                return [-1, name];
            }
        }
        return [-1, "nil"];
    }

    static #getConditionData(condExpr) {
        if (condExpr.numChildren == 1 && condExpr.children[0].instanceOf("binaryOp")) {
            const binaryOp = condExpr.children[0];
            const lhs = binaryOp.children[0];
            const rhs = binaryOp.children[1];

            if (lhs.instanceOf("varref") && rhs.instanceOf("intLiteral")) {
                const boundVar = lhs.name;
                const bound = rhs.value;

                switch (binaryOp.kind) {
                    case "lt": case "gt":
                        return [bound, boundVar];
                    case "le":
                        return [bound + 1, boundVar];
                    case "ge":
                        return [bound - 1, boundVar];
                    default:
                        return [-1, boundVar, true];
                }
            }
            if (lhs.instanceOf("intLiteral") && rhs.instanceOf("varref")) {
                const boundVar = rhs.name;
                const bound = lhs.value;

                switch (binaryOp.kind) {
                    case "lt":
                        return [bound, boundVar, false];
                    case "gt":
                        return [bound, boundVar, true];
                    case "le":
                        return [bound - 1, boundVar, false];
                    case "ge":
                        return [bound + 1, boundVar, true];
                    default:
                        return [-1, boundVar, true];
                }
            }
        }
        return [-1, "nil", false];
    }

    static #getIncrementData(incExpr) {
        if (incExpr.numChildren == 1 && incExpr.children[0].instanceOf("unaryOp")) {
            const unaryOp = incExpr.children[0];
            const operand = unaryOp.children[0];

            if (operand.instanceOf("varref")) {
                const incrementVar = operand.name;
                const increment = 1;

                switch (unaryOp.kind) {
                    case "pre_inc":
                        return [increment, incrementVar];
                    case "pre_dec":
                        return [-increment, incrementVar];
                    case "post_inc":
                        return [increment, incrementVar];
                    case "post_dec":
                        return [-increment, incrementVar];
                    default:
                        return [-1, incrementVar];
                }
            }
        }
        if (incExpr.numChildren == 1 && incExpr.children[0].instanceOf("binaryOp")) {
            const binaryOp = incExpr.children[0];
            const lhs = binaryOp.children[0];
            const rhs = binaryOp.children[1];

            if (lhs.instanceOf("varref") && rhs.instanceOf("intLiteral")) {
                const incVar = lhs.name;
                const inc = rhs.value;

                switch (binaryOp.kind) {
                    case "add":
                        return [inc, incVar];
                    case "sub":
                        return [-inc, incVar];
                    default:
                        return [-1, incVar];
                }
            }
            if (lhs.instanceOf("intLiteral") && rhs.instanceOf("varref")) {
                const incVar = rhs.name;
                const inc = lhs.value;

                switch (binaryOp.kind) {
                    case "add":
                        return [inc, incVar];
                    case "sub":
                        return [-inc, incVar];
                    default:
                        return [-1, incVar];
                }
            }
        }
        return [-1, "nil"];
    }

    static #calculateTripCount(initialVal, bound, increment) {
        if (increment == 0) {
            return -1;
        }

        if (increment > 0) {
            if (initialVal > bound) {
                return -1;
            }
            return Math.floor((bound - initialVal) / increment);
        }
        if (increment < 0) {
            if (initialVal < bound) {
                return -1;
            }
            return Math.floor((initialVal - bound) / -increment);
        }
        return -1;
    }

    static #handleWhileLoop(loop) {
        println("[TripCountCalculator] ERROR: while and do-while statements are not yet supported");
        return -1;
    }
}