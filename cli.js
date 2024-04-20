#!/usr/bin/env node
const fs = require("fs");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const packageJson = require("./package.json");
const generateStyles = require("./lib/generateStyles");

const options = yargs(hideBin(process.argv))
  .usage("Usage: $0 [command|options]")
  .command("init", "Generate tenoxui config file", {}, () => {
    generateConfigFile();
  })
  .command("build", "Generate styles", {}, () => {
    generateStyles.generateStyles();
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

console.log(`${generateStyles.getTimeStamp()} tenoxui-cli v${packageJson.version}`);

if (options.watch) {
  generateStyles.generateStyles({ watchMode: true });
} else if (options.watch) {
  generateConfigFile();
} else {
  console.log(
    `${generateStyles.getTimeStamp()} Use -h or --help to see all command!`,
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
    `${generateStyles.getTimeStamp()} Config file generated successfully!`,
  );
}
