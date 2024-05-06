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
                structs[name] = struct;
            }

            else {
                structs[name] = struct;
            }
        }
        // we're selecting all structs for the moment. We'll filter them later if needed

        return structs;
    }

    decompose(struct, name) {
        println(`[StructDecomp] Decomposing struct "${name}"`);

        const decls = this.getAllDeclsOfStruct(struct, name);
        println(`[StructDecomp] Found ${decls.length} declarations for struct "${name}"`);


    }

    getAllDeclsOfStruct(struct, name) {
        const decls = [];

        for (const decl of Query.search("vardecl")) {
            const type = decl.type;
            // not sure if other types of declarations are relevant
            if (type.kind === "ElaboratedType" || type.kind === "PointerType") {
                const typeName = type.code.replace("*", "").replace("struct ", "").trim();
                //println(`decl: ${decl.name}, kind: ${type.kind}, type: "${typeName}"`);

                if (typeName === name) {
                    decls.push(decl);
                }
            }
        }
        return decls;
    }
}