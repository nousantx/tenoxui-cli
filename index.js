const fs = require("fs");
const glob = require("glob");
const cheerio = require("cheerio");
const chokidar = require("chokidar");
function getTimeStamp() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `\x1b[32m[\x1b[34m${hours}:${minutes}:${seconds}\x1b[32m]\x1b[0m`;
}
let config = {};
// Load configuration
try {
  config = require("./tenoxui.config.js");
} catch (err) {
  console.log(`${getTimeStamp()} No configuration file found!`);
  return;
}

const { inputStyles, inputFiles, outputStyles, isModule } = config;

function extractClosestClassName(selector) {
  // Match the first class name in the selector
  const match = selector.match(/\.([^\s>+~]+)/);
  return match ? match[1] : null;
}

function scanHtml(htmlFilePaths, styles) {
  const usedStyles = {};

  htmlFilePaths.forEach((filePath) => {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const $ = cheerio.load(fileContent);

    const usedSelectors = new Set();
    $("[class]").each((index, element) => {
      const classes = $(element).attr("class").split(" ");
      classes.forEach((className) => usedSelectors.add(className));
    });

    Object.entries(styles).forEach(([selector, style]) => {
      const closestClassName = extractClosestClassName(selector);
      if (closestClassName && usedSelectors.has(closestClassName)) {
        usedStyles[selector] = style;
      }
    });
  });

  return usedStyles;
}

function generateOutput(changedFilePath = null) {
  let htmlFilePaths = [];
  if (changedFilePath) {
    htmlFilePaths = [changedFilePath];
  } else {
    htmlFilePaths = glob.sync(inputFiles);
  }
  const usedStyles = scanHtml(htmlFilePaths, inputStyles);
  const outputDir = outputStyles.substring(0, outputStyles.lastIndexOf("/"));
  const output = isModule ? "export const styles = " : "const styles = ";
  const message = changedFilePath
    ? `${getTimeStamp()} File \x1b[33m${changedFilePath}\x1b[0m changed. Regenerating styles...`
    : `${getTimeStamp()} Styles extracted and saved to \x1b[33m${outputStyles}\x1b[0m`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(
    outputStyles,
    `${output}${JSON.stringify(usedStyles, null, 2)};`,
  );
  console.log(message);
}

// Check if watch mode is enabled
const watchMode =
  process.argv.includes("-w") || process.argv.includes("--watch");

// Watch mode
if (watchMode) {
  console.log(`${getTimeStamp()} -w flag detected.\x1b[0m Using watch mode...`);
  const watcher = chokidar.watch(inputFiles);
  watcher.on("change", (changedFilePath) => {
    generateOutput(changedFilePath);
    console.log(
      `${getTimeStamp()} Style for \x1b[33m${changedFilePath}\x1b[0m generated successfully!`,
    );
  });
} else {
  generateOutput();
  console.log(
    `${getTimeStamp()} \x1b[32mStyles generated successfully!\x1b[0m`,
  );
}
