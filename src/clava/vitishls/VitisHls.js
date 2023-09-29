"use strict";

laraImport("lara.util.ProcessExecutor");
laraImport("clava.vitishls.VitisHlsReportParser");

class VitisHls {
    topFunction;
    platform;
    clock;
    vitisDir = "VitisHLS";
    vitisProjName = "VitisHLSClavaProject";
    sourceFiles = [];
    filesToCopy = [];
    flowTarget = "vivado";

    constructor(topFunction, clock = 10, platform = "xcvu5p-flva2104-1-e") {
        this.topFunction = topFunction;
        this.platform = platform;
        this.setClock(clock);
    }

    setTopFunction(topFunction) {
        this.topFunction = topFunction;
        return this;
    }

    setPlatform(platform) {
        this.platform = platform;
        return this;
    }

    setClock(clock) {
        if (clock <= 0) {
            throw new Error(`${this.getTimestamp()} Clock value must be a positive integer!`);
        }
        else {
            this.clock = clock;
        }
        return this;
    }

    setFlowTarget(target) {
        this.flowTarget = target;
        return this;
    }

    setOutputDirectory(dir) {
        this.vitisDir = dir;
    }

    setProjectName(name) {
        this.vitisProjName = name;
    }

    addSource(file) {
        this.sourceFiles.push(file);
        return this;
    }

    addSourcesInFolder(folder) {
        println(folder);

        let cnt = 0;
        for (const file of Io.getFiles(folder)) {
            const exts = [".c", ".cpp", ".h", ".hpp"];
            const isValid = exts.some((ext) => file.name.includes(ext));
            if (isValid) {
                cnt++;
                this.sourceFiles.push(file.name);
                this.filesToCopy.push(folder + "/" + file.name);
            }
        }


        this.log(`Added ${cnt} file(s) from folder ${folder}`);
        return this;
    }

    synthesize(verbose = true) {

        this.log("Setting up Vitis HLS executor");
        this.clean();

        if (this.sourceFiles.length == 0) {
            this.log("No files were provided to Vitis HLS! Aborting...");
            return false;
        }

        for (const file of this.filesToCopy) {
            Io.copyFile(file, this.vitisDir);
        }

        this.generateTclFile();
        this.executeVitis(verbose);

        return Io.isFile(this.getSynthesisReportPath());
    }

    clean() {
        Io.deleteFolderContents(this.vitisDir);
    }

    getSynthesisReportPath() {
        return this.vitisDir + "/" + this.vitisProjName + "/solution1/syn/report/csynth.xml";
    }

    executeVitis(verbose) {
        this.log("Executing Vitis HLS");
        this.log("-".repeat(50));

        const pe = new ProcessExecutor();
        pe.setWorkingDir(this.vitisDir);
        pe.setPrintToConsole(verbose);
        pe.execute("vitis_hls", "-f", "script.tcl");

        this.log("-".repeat(50));
        this.log("Finished executing Vitis HLS");
    }

    getTclInputFiles() {
        let tclCommands = "";

        for (const file of this.sourceFiles) {
            tclCommands += `add_files ${file}\n`;
        }
        return tclCommands;
    }

    generateTclFile() {
        const cmd = `
open_project ${this.vitisProjName}
set_top ${this.topFunction}
${this.getTclInputFiles()}
open_solution "solution1" -flow_target ${this.flowTarget}
set_part { ${this.platform}}
create_clock -period ${this.clock} -name default
csynth_design
exit
    `;
        Io.writeFile(this.vitisDir + "/script.tcl", cmd);
    }

    getSynthesisReport() {
        this.log("Processing synthesis report");
        const parser = new VitisHlsReportParser(this.getSynthesisReportPath());
        const json = parser.getSanitizedJSON();
        this.log("Finished processing synthesis report");
        return json;
    }

    preciseStr(n, decimalPlaces) {
        return (+n).toFixed(decimalPlaces);
    }

    prettyPrintReport(report) {
        const period = this.preciseStr(report["clockEstim"], 2);
        const freq = this.preciseStr(report["fmax"], 2);
        const out = `
----------------------------------------
Vitis HLS synthesis report

Targeted a ${report["platform"]} with target clock ${freq} ns

Achieved an estimated clock of ${period} ns (${freq} MHz)

Estimated latency for top function ${report["topFun"]}:
Worst case: ${report["latencyWorst"]} cycles
  Avg case: ${report["latencyAvg"]} cycles
 Best case: ${report["latencyBest"]} cycles

Estimated execution time:
Worst case: ${report["execTimeWorst"]} s
  Avg case: ${report["execTimeAvg"]} s
 Best case: ${report["execTimeBest"]} s

Resource usage:
FF:   ${report["FF"]} (${this.preciseStr(report["perFF"] * 100, 2)}%)
LUT:  ${report["LUT"]} (${this.preciseStr(report["perLUT"] * 100, 2)}%)
BRAM: ${report["BRAM"]} (${this.preciseStr(report["perBRAM"] * 100, 2)}%)
DSP:  ${report["DSP"]} (${this.preciseStr(report["perDSP"] * 100, 2)}%)
----------------------------------------`;
        console.log(out);
    }

    getTimestamp() {
        const curr = new Date();
        const res = `[VITIS_HLS_EXTENSION ${curr.getHours()}:${curr.getMinutes()}:${curr.getSeconds()}]`;
        return res;
    }

    log(message) {
        println(`${this.getTimestamp()} ${message}`);
    }
}