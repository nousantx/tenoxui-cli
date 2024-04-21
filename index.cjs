#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const cheerio = require("cheerio");
const chokidar = require("chokidar");
const yargs = require("yargs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

class Extractor {
  static getTimeStamp() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    return `\x1b[32m[\x1b[34m${hours}:${minutes}:${seconds}\x1b[32m]\x1b[0m`;
  }

  static loadConfig() {
    let config;
    const configPath = path.resolve(process.cwd(), "tenoxui.config.cjs");
    try {
      config = require(configPath);
    } catch (err) {
      console.log(
        `${Extractor.getTimeStamp()} No configuration file found at ${configPath}!`,
      );
      return;
    }
    return config;
  }

  static extractClosestClassName(selector) {
    const match = selector.match(/\.([^\s>+~]+)/);
    return match ? match[1] : null;
  }

  static extractClassNamesFromHTML(fileContent) {
    const $ = cheerio.load(fileContent);
    const usedSelectors = new Set();
    $("[class]").each((index, element) => {
      const classes = $(element).attr("class").split(" ");
      classes.forEach((className) => usedSelectors.add(className));
    });
    return Array.from(usedSelectors);
  }

  static extractClassNamesFromJSX(code) {
    const classnames = [];
    const ast = parser.parse(code, {
      sourceType: "unambiguous",
      plugins: ["jsx"],
    });

    traverse(ast, {
      JSXAttribute(path) {
        if (path.node.name.name === "className") {
          if (t.isStringLiteral(path.node.value)) {
            classnames.push(...path.node.value.value.split(" "));
          }
        }
      },
    });

    return classnames;
  }
}

class StyleScanner extends Extractor {
  static scanHtml(htmlFilePaths, styles) {
    const usedStyles = {};

    htmlFilePaths.forEach((filePath) => {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const htmlClassNames = Extractor.extractClassNamesFromHTML(fileContent);
      const jsxClassNames = Extractor.extractClassNamesFromJSX(fileContent);
      const allClassNames = [...htmlClassNames, ...jsxClassNames];

      const usedSelectors = new Set(allClassNames);

      Object.entries(styles).forEach(([selector, style]) => {
        const closestClassName = Extractor.extractClosestClassName(selector);
        if (closestClassName && usedSelectors.has(closestClassName)) {
          usedStyles[selector] = style;
        }
      });
    });

    return usedStyles;
  }
}

class StyleGenerator extends StyleScanner {
  static generateOutput(changedFilePath = null) {
    const { inputStyles, inputFiles, outputStyles, isModule } =
      Extractor.loadConfig();

    let htmlFilePaths = [];
    if (changedFilePath) {
      htmlFilePaths = [changedFilePath];
    } else {
      htmlFilePaths = glob.sync(inputFiles);
    }
    const usedStyles = StyleScanner.scanHtml(htmlFilePaths, inputStyles);
    const outputDir = outputStyles.substring(0, outputStyles.lastIndexOf("/"));
    const output = isModule ? "export const styles = " : "const styles = ";
    const message = changedFilePath
      ? `${Extractor.getTimeStamp()} File \x1b[33m${changedFilePath}\x1b[0m changed. Regenerating styles...`
      : `${Extractor.getTimeStamp()} Styles extracted and saved to \x1b[33m${outputStyles}\x1b[0m`;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(
      outputStyles,
      `${output}${JSON.stringify(usedStyles, null, 2)};`,
    );
    console.log(message);

    return { inputStyles, inputFiles, outputStyles, isModule };
  }
  static generateConfigFile() {
    const configContent = `module.exports = {
  inputFiles: "./**/*.{html,jsx}",
  inputStyles: {},
  outputStyles: "dist/output.js"
};`;

    fs.writeFileSync("tenoxui.config.cjs", configContent);
    console.log(
      `${Extractor.getTimeStamp()} Config file generated successfully!`,
    );
  }
}

// Command line options using yargs
const argv = yargs
  .usage("Usage: $0 [option|command]")
  .command("init", "Generate tenoxui config file", {}, () => {
    StyleGenerator.generateConfigFile();
    process.exit();
  })
  .command("build", "Generate styles", {}, () => {
    StyleGenerator.generateOutput();
    process.exit();
  })
  .option("watch", {
    alias: "w",
    describe: "Watch files for changes",
    type: "boolean",
  })
  .option("init", {
    alias: "i",
    describe: "Generate tenoxui config file",
    type: "boolean",
  })
  .help()
  .alias("help", "h").argv;

// Watch mode
if (argv.watch) {
  const { inputFiles } = Extractor.loadConfig();
  console.log(
    `${Extractor.getTimeStamp()} -w flag detected.\x1b[0m Using watch mode...`,
  );
  const watcher = chokidar.watch(inputFiles);
  watcher.on("change", (changedFilePath) => {
    StyleGenerator.generateOutput(changedFilePath);
    console.log(
      `${Extractor.getTimeStamp()} Style for \x1b[33m${changedFilePath}\x1b[0m generated successfully!`,
    );
  });
} else if (argv.init) {
  StyleGenerator.generateConfigFile();
} else {
  console.log(`${Extractor.getTimeStamp()} Nothing to do...`);
  console.log(`${Extractor.getTimeStamp()} Use -h or --help to show help...`);
}
