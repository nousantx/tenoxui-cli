#!/usr/bin/env node
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const generateStyles = require("./generateStyles");

const options = yargs(hideBin(process.argv))
  .usage("Usage: $0 [options]")
  .option("watch", {
    alias: "w",
    describe: "Watch for file changes",
    type: "boolean",
  }).argv;

if (options.watch) {
  generateStyles({ watchMode: true });
} else {
  generateStyles();
}
