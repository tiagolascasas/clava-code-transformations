"use strict";

laraImport("clava.ClavaJoinPoints");;

class StructDecomposer {
    #silent;

    constructor(silent = false) {
        this.#silent = silent;
    }

    decomposeAll() {
        const structs = {};

        for (const struct of Query.search("struct")) {
            const name = this.#getStructName(struct);
            structs[name] = struct;
        }
        this.#log(`Found ${Object.keys(structs).length} eligible structs`);

        const decompNames = [];
        for (const structName in structs) {
            const struct = structs[structName];
            this.decompose(struct, structName);
            this.#log("------------------------------");
            decompNames.push(structName);
        }
        return decompNames;
    }

    decomposeByName(nameOrNames) {
        const names = Array.isArray(nameOrNames) ? nameOrNames : [nameOrNames];
        this.#log(`Structs to decompose: ${names.join(", ")}`);

        const decompNames = [];
        for (const name of names) {
            for (const struct of Query.search("struct")) {
                const structName = this.#getStructName(struct);

                if (structName === name) {
                    this.decompose(struct, name);
                    this.#log("------------------------------");
                    decompNames.push(name);
                }
            }
        }
        return decompNames;
    }

    decompose(struct, name) {
        this.#log(`Decomposing struct "${name}"`);

        const decls = this.#getAllDeclsOfStruct(name);
        this.#log(`Found ${decls.length} declarations for struct "${name}"`);

        const params = this.#getAllParamsOfStruct(name);
        this.#log(`Found ${params.length} parameters for struct "${name}"`);

        for (const param of params) {
            this.#decomposeParam(param, struct);
        }

        for (const decl of decls) {
            this.#decomposeDecl(decl, struct);
        }

        for (const param of params) {
            this.#removeStructParam(param);
        }

        for (const decl of decls) {
            this.#removeInits(decl, struct);
        }
    }

    #log(msg) {
        if (!this.#silent) {
            println(`[StructDecomp] ${msg}`);
        }
    }

    #getStructName(struct) {
        let name = struct.name;

        // typedef struct { ... } typedef_name;
        if (struct.name === "") {
            const typedef = struct.children[struct.children.length - 1].children[0];
            name = typedef.name;
        }
        return name;
    }

    #getAllDeclsOfStruct(name) {
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

    #getAllParamsOfStruct(name) {
        const params = [];

        for (const decl of Query.search("param")) {
            const type = decl.type;
            const typeName = type.code.replace("*", "").replace("struct ", "").trim();
            const parentFun = decl.ancestor("function");
            const hasParentFunction = parentFun != undefined && parentFun.isImplementation;

            if (typeName === name && decl.isParam && hasParentFunction) {
                //println(`decl: ${decl.name}, kind: ${type.kind}, type: "${typeName}"`);
                params.push(decl);
            }
        }
        return params;
    }

    #decomposeDecl(decl, struct) {
        // Find all struct decls (local and global), and create vars for each field
        const newVars = this.#createNewVars(decl, struct);

        // Replace all references to the struct fields with the new vars
        this.#replaceFieldRefs(decl, newVars);

        // Replace all references to the struct itself in function calls
        this.#replaceRefsInCalls(decl, newVars);
    }

    #decomposeParam(param, struct) {
        // Find all struct params, and create params for each field
        const newParams = this.#createNewParams(param, struct);

        // Replace all references to the struct fields with the new params
        this.#replaceFieldRefs(param, newParams);
    }

    #createNewVars(decl, struct) {
        const newVars = [];
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
            newVars.push([fieldName, newVar]);
        }

        return newVars;
    }

    #createNewParams(param, struct) {
        const newParams = [];
        const paramsOrdered = [];
        const declName = param.name;

        println(`${param.filename}:${param.line}`);
        const fun = param.ancestor("function");

        for (const field of struct.fields) {
            const fieldName = field.name;
            const newParamName = `${declName}_${fieldName}`;

            let fieldType = field.type;
            if (param.type.kind == "PointerType") {
                fieldType = ClavaJoinPoints.pointer(fieldType);
            }

            const newParam = ClavaJoinPoints.param(newParamName, fieldType);
            newParams.push([fieldName, newParam]);
            paramsOrdered.push(newParam);
        }

        // update function signature with the new params, removing the previous struct
        const preParams = [];
        const postParams = [];
        let found = false;

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
                let newVar = null;
                for (const [name, varDecl] of newVars) {
                    if (name === fieldName) {
                        newVar = varDecl;
                        break;
                    }
                }
                const newRef = ClavaJoinPoints.varRef(newVar);

                // foo.bar
                if (!field.arrow) {
                    field.replaceWith(newRef);
                }
                else {
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
            }
        }
    }

    #replaceRefsInCalls(decl, newVars) {
        const declName = decl.name;

        let startingPoint;
        if (decl.isGlobal) {
            startingPoint = decl.root;
        }
        else {
            startingPoint = decl.currentRegion;
        }

        const callsToReplace = [];
        for (const call of Query.searchFrom(startingPoint, "call")) {
            const idxToReplace = new Map();
            for (let i = 0; i < call.args.length; i++) {
                const arg = call.args[i];
                let varref = null;
                if (arg.instanceOf("varref") && arg.name === declName) {
                    varref = arg;
                }
                else {
                    for (const ref of Query.searchFrom(arg, "varref")) {
                        if (ref.name === declName) {
                            varref = ref;
                            break;
                        }
                    }
                }
                if (varref) {
                    idxToReplace.set(i, varref);
                }
            }
            if (idxToReplace.size === 0) {
                continue;
            }

            const newCall = this.#makeNewCall(call, idxToReplace, newVars, decl);
            callsToReplace.push([call, newCall]);
        }

        for (const [oldCall, newCall] of callsToReplace) {
            oldCall.replaceWith(newCall);
        }
    }


    #makeNewCall(call, idxToReplace, newVars, decl) {
        const finalArgList = [];

        for (let i = 0; i < call.args.length; i++) {
            if (idxToReplace.has(i)) {
                const argToReplace = idxToReplace.get(i);
                const newArgs = this.#makeNewArgs(argToReplace, newVars, decl);
                finalArgList.push(...newArgs);
            }
            else {
                finalArgList.push(call.args[i]);
            }
        }

        //println(call.name + " -> " + finalArgList.length);
        const fun = call.function;
        const newCall = ClavaJoinPoints.call(fun, finalArgList);
        return newCall;
    }

    #makeNewArgs(arg, newVars) {
        const newArgs = [];
        const isAddrOf = arg.parent.instanceOf("unaryOp") && arg.parent.kind === "addr_of";
        const isDeref = arg.parent.instanceOf("unaryOp") && arg.parent.kind === "deref";

        for (const [field, newFieldVar] of newVars) {
            const newArgType = newFieldVar.type;
            const newArg = ClavaJoinPoints.varRef(newFieldVar, newArgType);

            if (isAddrOf) {
                const addrOfNewArg = ClavaJoinPoints.unaryOp("&", newArg);
                newArgs.push(addrOfNewArg);
            }
            else if (isDeref) {
                const derefNewArg = ClavaJoinPoints.unaryOp("*", newArg);
                newArgs.push(derefNewArg);
            }
            else {
                newArgs.push(newArg);
            }
        }
        return newArgs;
    }

    #removeStructParam(param) {
        const fun = param.parent;
        const newParams = [];

        for (const funParam of fun.params) {
            if (funParam.name !== param.name) {
                newParams.push(funParam);
            }
        }
        fun.setParams(newParams);
    }

    #removeInits(decl, struct) {

    }
}