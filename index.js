// scanHtml.js
const fs = require("fs");
const cheerio = require("cheerio");
const chokidar = require("chokidar");

// Load configuration
let config = {};
try {
  config = require("./tenoxui.config");
} catch (err) {
  console.log("Configuration file not found. Using default options.");
}

const { inputStyles, inputFiles, outputStyles } = config;

function scanHtml(htmlFilePath, styles) {
  const fileContent = fs.readFileSync(htmlFilePath, "utf8");
  const $ = cheerio.load(fileContent);

  const usedSelectors = new Set();
  $("[class]").each((index, element) => {
    const classes = $(element).attr("class").split(" ");
    classes.forEach((className) => usedSelectors.add(`.${className}`));
  });

  const usedStyles = {};
  Object.entries(styles).forEach(([selector, style]) => {
    if (usedSelectors.has(selector)) {
      usedStyles[selector] = style;
    }
  });

  return usedStyles;
}

function generateOutput() {
  const usedStyles = scanHtml(inputFiles, inputStyles);

  fs.writeFileSync(
    outputStyles,
    `const styles = ${JSON.stringify(usedStyles, null, 2)};\nmakeStyles(styles)`
  );
  console.log(`Styles extracted and saved to ${outputStyles}`);
}

// Initial generation of output file
generateOutput();

// Check if watch mode is enabled
const watchMode = process.argv.includes("-w") || process.argv.includes("--watch");

// Watch mode
if (watchMode) {
  const watcher = chokidar.watch(inputFiles);
  watcher.on("change", () => {
    console.log("HTML file changed. Regenerating styles...");
    generateOutput();
  });
} else {
  console.log("Watch mode is disabled. To enable, use -w or --watch flag.");
}
