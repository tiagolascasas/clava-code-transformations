"use strict";

laraImport("clava.ClavaJoinPoints");

class StructDecomposer {

    constructor() { }

    log(msg) {
        println(`[StructDecomp] ${msg}`);
    }

    decomposeAllEligible() {
        const structs = this.findEligibleStructs();

        for (const structName in structs) {
            const struct = structs[structName];
            this.decompose(struct, structName);
            this.log("------------------------------");
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
        this.log(`Decomposing struct "${name}"`);

        const decls = this.getAllDeclsOfStruct(struct, name);
        this.log(`Found ${decls.length} declarations for struct "${name}"`);

        for (const decl of decls) {
            this.#decomposeDecl(decl, struct, name);
        }

    }

    getAllDeclsOfStruct(struct, name) {
        const decls = [];

        for (const decl of Query.search("vardecl")) {
            const type = decl.type;
            const typeName = type.code.replace("*", "").replace("struct ", "").trim();

            if (typeName === name && !decl.isParam) {
                //println(`decl: ${decl.name}, kind: ${type.kind}, type: "${typeName}"`);
                decls.push(decl);
            }
        }
        return decls;
    }

    #decomposeDecl(decl, struct, name) {
        const newVars = this.#createNewVars(decl, struct);

        //...
    }

    #createNewVars(decl, struct) {
        const newVars = {};
        const declName = decl.name;

        for (const field of struct.fields) {
            const fieldName = field.name;
            const newVarName = `${declName}_${fieldName}`;

            let fieldType = field.type;
            if (decl.type.kind == "PointerType") {
                fieldType = ClavaJoinPoints.pointer(fieldType);
            }

            const newVar = ClavaJoinPoints.varDeclNoInit(newVarName, fieldType);
            decl.insertAfter(newVar);

            newVars[fieldName] = newVar;
        }

        return newVars;
    }
}