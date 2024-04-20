#!/usr/bin/env node
const fs = require("fs");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const generateStyles = require("./generateStyles");
const options = yargs(hideBin(process.argv))
  .command("init", "Generate tenoxui config file", {}, () => {
    generateConfigFile();
  })
  .command("build", "Generate styles", {}, () => {
    generateStyles();
  })
  .option("watch", {
    alias: "w",
    describe: "Watch for file changes",
    type: "boolean",
  })
  .option("init", {
    alias: "i",
    describe: "Generate tenoxui config file",
    type: "boolean",
  })
  .help("h")
  .alias("h", "help").argv;

if (options.watch) {
  generateStyles({ watchMode: true });
} else if (options.watch) {
  generateConfigFile();
} else {
  // generateStyles();
  console.log(
    `${generateStyles.getTimeStamp()} Use -h or --help to see all command!`
  );
}

function generateConfigFile() {
  const configContent = `module.exports = {
  inputFiles: "./**/*.{html,jsx}",
  inputStyles: {},
  outputStyles: "dist/output.js"
};`;

  fs.writeFileSync("tenoxui.config.js", configContent);
  console.log(
    `${generateStyles.getTimeStamp()} Config file generated successfully!`
  );
}
