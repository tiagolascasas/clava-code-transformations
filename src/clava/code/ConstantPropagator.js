"use strict";

laraImport("weaver.Query");

class ConstantPropagator {
    constructor() { }

    doPassesUntilStop(maxPasses = 99) {
        let passes = 1;
        let hasChanged = this.doPass();

        while (hasChanged && passes < maxPasses) {
            hasChanged = this.doPass();
            passes++;
        }
        return passes;
    }

    doPass() {
        for (const fun of Query.search("function")) {
            this.#propagateInFunction(fun);
        }

        return false;
    }

    #propagateInFunction(fun) {
        const allDefs = [];
        for (const decl of Query.searchFrom(fun, "vardecl")) {
            allDefs.push(decl);
        }
        for (const param of Query.searchFrom(fun, "param")) {
            allDefs.push(param);
        }

        for (const def of allDefs) {
            const refChain = this.#findRefChain(def, fun);
            this.#propagateChain(refChain);
        }
    }

    #findRefChain(def, fun) {
        const name = def.name;
        const refChain = [];

        for (const ref of Query.searchFrom(fun, "varref", { name: name })) {
            refChain.push(ref);
        }
        return refChain;
    }

    #propagateChain(refChain) {
        //println(refChain.length);
    }
}