"use strict";

laraImport("weaver.Query");
laraImport("clava.ClavaJoinPoints");

class SwitchToIf {
    constructor() { }

    convert(switchStmt) {
        if (!switchStmt.instanceOf("switch")) {
            println("[SwitchToIf] Error: " + switchStmt.joinPointType + " is not a switch statement");
            return;
        }
    }
}