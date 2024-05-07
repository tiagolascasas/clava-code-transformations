"use strict";

laraImport("clava.ClavaJoinPoints");;

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

        const decls = this.getAllDeclsOfStruct(name);
        this.log(`Found ${decls.length} declarations for struct "${name}"`);

        const params = this.getAllParamsOfStruct(name);
        this.log(`Found ${params.length} parameters for struct "${name}"`);

        for (const decl of decls) {
            this.#decomposeDecl(decl, struct, name);
        }
        for (const param of params) {
            this.#decomposeParam(param, struct, name);
        }
    }

    getAllDeclsOfStruct(name) {
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

    getAllParamsOfStruct(name) {
        const params = [];

        for (const decl of Query.search("param")) {
            const type = decl.type;
            const typeName = type.code.replace("*", "").replace("struct ", "").trim();

            if (typeName === name && decl.isParam) {
                //println(`decl: ${decl.name}, kind: ${type.kind}, type: "${typeName}"`);
                params.push(decl);
            }
        }
        return params;
    }

    #decomposeDecl(decl, struct, name) {
        // Find all struct decls (local and global), and create vars for each field
        const newVars = this.#createNewVars(decl, struct);

        // Replace all references to the struct fields with the new vars
        this.#replaceFieldRefs(decl, newVars);
    }

    #decomposeParam(param, struct, name) {
        // Find all struct params, and create params for each field
        const newParams = this.#createNewParams(param, struct);

        // Replace all references to the struct fields with the new params
        this.#replaceFieldRefs(param, newParams);
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

    #createNewParams(param, struct) {
        const newParams = {};
        const paramsOrdered = [];
        const declName = param.name;
        let fun = param.parent;
        while (!fun.instanceOf("function")) {
            fun = fun.parent;
        }

        for (const field of struct.fields) {
            const fieldName = field.name;
            const newParamName = `${declName}_${fieldName}`;

            let fieldType = field.type;
            if (param.type.kind == "PointerType") {
                fieldType = ClavaJoinPoints.pointer(fieldType);
            }

            const newParam = ClavaJoinPoints.param(newParamName, fieldType);
            newParams[fieldName] = newParam;
            paramsOrdered.push(newParam);
        }

        // update function signature with the new params, removing the previous struct
        const preParams = [];
        const postParams = [];
        let found = false;
        println(fun.joinPointType);
        for (const funParam of fun.params) {
            if (funParam.name === param.name) {
                preParams.push(funParam);
                found = true;
            }
            else if (!found) {
                postParams.push(funParam);
            }
            else {
                preParams.push(funParam);
            }
        }
        const finalParams = [...preParams, ...paramsOrdered, ...postParams];
        fun.setParams(finalParams);

        return newParams;
    }

    #replaceFieldRefs(decl, newVars) {
        const declName = decl.name;

        let startingPoint;
        if (decl.isGlobal) {
            startingPoint = decl.root;
        }
        else if (decl.isParam) {
            startingPoint = decl.parent;
        }
        else {
            startingPoint = decl.currentRegion;
        }

        for (const ref of Query.searchFrom(startingPoint, "varref")) {
            if (ref.name === declName && ref.parent.instanceOf("memberAccess")) {
                const field = ref.parent;
                const fieldName = field.name;
                const newVar = newVars[fieldName];
                const newRef = ClavaJoinPoints.varRef(newVar);

                // foo.bar
                if (!field.arrow) {
                    field.replaceWith(newRef);
                }
                else {
                    try {
                        const derefRef = ClavaJoinPoints.unaryOp("*", newRef);

                        // a + foo->bar
                        if (field.parent.instanceOf("binaryOp") && field.parent.right == field) {
                            const parenthesis = ClavaJoinPoints.parenthesis(derefRef);
                            field.replaceWith(parenthesis);
                        }
                        // foo->bar
                        else {
                            field.replaceWith(derefRef);
                        }
                    }
                    catch (e) {
                        println(e.stack);
                    }
                }
            }
        }
    }
}