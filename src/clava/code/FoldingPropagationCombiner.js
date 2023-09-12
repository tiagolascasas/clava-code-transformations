"use strict";

laraImport("clava.code.ConstantPropagator");
laraImport("clava.code.ConstantFolder");

class FoldingPropagationCombiner {
    constructor() { }

    doPassesUntilStop(maxPasses = 99) {
        const constFolder = new ConstantFolder();
        const constPropagator = new ConstantPropagator();

        let passes = 1;
        let stillFolding = constFolder.doPass();
        let stillPropagating = constPropagator.doPass();

        while ((stillFolding && stillPropagating) && (passes < maxPasses)) {
            if (stillFolding) {
                stillFolding = constFolder.doPass();
            }
            if (stillPropagating) {
                stillPropagating = constPropagator.doPass();
            }
            passes++;
        }   
        return passes;
    }
}