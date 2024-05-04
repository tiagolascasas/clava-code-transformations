"use strict";

class StructDecomposer {

    constructor() { }

    decomposeAllEligible() {
        const structs = this.findEligibleStructs();

        for (const structName in structs) {
            const struct = structs[structName];
            this.decompose(struct, structName);
        }
    }

    findEligibleStructs() {
        const structs = {};

        for (const struct of Query.search("struct")) {
            let name = struct.name;

            // typedef struct { ... } typedef_name;
            if (struct.name === "") {
                const typedef = struct.children[struct.children.length - 1].children[0];
                name = typedef.name;
            }

            if (this.isEligible(struct, name)) {
                structs[name] = struct;
            }
        }

        return structs;
    }

    isEligible(struct, name) {
        return true;
    }

    decompose(struct, name) {
        println("Decomposing struct " + name);

        for (const decl of Query.search("vardecl")) {
            println("Decl: " + decl.name + ", " + decl.type.joinPointType);
        }
    }
}