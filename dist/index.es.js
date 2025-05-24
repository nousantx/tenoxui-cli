import u from "fs";
import m from "path";
import { glob as x } from "glob";
import S from "nguraijs";
import { TenoxUI as p, constructRaw as $ } from "tenoxui";
import y from "chokidar";
import l from "chalk";
class D {
  constructor(e = {}) {
    this.logger = e.logger, this.scanner = e.scanner, this.generator = e.generator;
  }
  async run() {
    this.logger.minimal || this.logger.info("Starting class name extraction and CSS generation");
    const { results: e, scanTime: s } = await this.scanner.scan(), i = Object.values(e).flat(), t = await this.generator.generate(i);
    if (t.success) {
      const o = {
        "Scanning files": s,
        "Processing classes": t.metrics.processingTime,
        "Rendering CSS": t.metrics.renderingTime,
        "Writing file": t.metrics.writingTime,
        "Total time": t.metrics.totalTime
      };
      return this.logger.performance(o, t.classCount), this.logger.minimal || this.logger.success(
        `Generated CSS with ${t.classCount} unique classes at ${t.outputPath}`
      ), {
        success: !0,
        classCount: t.classCount,
        outputPath: t.outputPath,
        metrics: o
      };
    } else
      return this.logger.error("Failed to generate CSS"), {
        success: !1,
        error: t.error
      };
  }
}
class C {
  constructor(e = [], s = {}) {
    this.config = e, this.cssConfig = s, this.core = new p(this.cssConfig);
  }
  extractClassNames(e) {
    try {
      const { all: s, prefix: i, type: t } = this.core.main.regexp(
        Object.keys(this.cssConfig.aliases || {}) || []
      ), o = new S({
        customOnly: !0,
        noUnknownToken: !0,
        noSpace: !0,
        custom: {
          className: [
            new RegExp(`!?${s.slice(1, -1)}`),
            new RegExp(`!?(?:(${i}):)?${t}`),
            ...this.config.map((r) => {
              const c = r.source;
              return new RegExp(`!?${c}`, r.flags);
            })
          ]
        }
      }), a = [
        ...new Set(
          o.tokenize(e).flatMap((r) => r.filter((c) => c.type === "className")).map((r) => r.value)
        )
      ];
      return this.core.process(a).map(
        (r) => (r.isImportant ? "!" : "") + (r.rules ? $(r.raw[0], r.raw[1], "", "") : r.raw[6])
      ) || [];
    } catch (s) {
      return console.error("Error extracting class names:", s), [];
    }
  }
}
class v {
  constructor(e = {}, s) {
    this.include = e.include || ["**/*.{js,jsx,ts,tsx}"], this.exclude = e.exclude || ["**/node_modules/**", "**/dist/**", "**/build/**"], this.rootDir = e.rootDir || ".", this.logger = s, this.extractor = new C(e.rules, e.cssConfig);
  }
  /**
   * Scan files using glob patterns
   * @returns {Object} - Object with file paths as keys and arrays of class names as values
   */
  async scan() {
    const e = {}, s = performance.now();
    try {
      const t = Array.isArray(this.include) ? this.include : [this.include], o = Array.isArray(this.exclude) ? this.exclude : [this.exclude];
      this.logger.debug(`Scanning with patterns: ${t.join(", ")}`), this.logger.debug(`Excluding patterns: ${o.join(", ")}`), this.logger.debug(`Root directory: ${this.rootDir}`);
      const a = await x(t, {
        cwd: this.rootDir,
        ignore: o,
        absolute: !1
        // Change to false to use relative paths
      });
      this.logger.debug(`Found ${a.length} files to process: ${JSON.stringify(a)}`);
      for (const g of a) {
        const r = m.join(this.rootDir, g);
        try {
          this.logger.debug(`Reading file: ${r}`);
          const c = u.readFileSync(r, "utf8"), h = this.extractor.extractClassNames(c);
          h.length > 0 ? (e[r] = h, this.logger.debug(
            `Extracted ${h.length} classes from ${g}: ${h.join(
              ", "
            )}`
          )) : this.logger.debug(`No classes found in ${g}`);
        } catch (c) {
          this.logger.error(`Error processing ${r}: ${c.message}`);
        }
      }
    } catch (t) {
      this.logger.error(`Error scanning files: ${t.message}`);
    }
    const i = performance.now();
    return { results: e, scanTime: i - s };
  }
}
class k {
  constructor(e = {}, s) {
    this.outputDir = e.outputDir || ".generated", this.outputFile = e.outputFile || "styles.css", this.cssConfig = e.tenoxui, this.logger = s;
  }
  /**
   * Generate CSS from class names
   * @param {string[]} classNames - Array of class names
   * @returns {Object} - Object with generation metrics
   */
  async generate(e) {
    const s = {};
    try {
      const i = performance.now(), t = [...new Set(e)], o = performance.now();
      s.processingTime = o - i;
      const a = new p(this.cssConfig), g = performance.now(), r = a.render(this.cssConfig.apply || {}, t), c = performance.now();
      s.renderingTime = c - g;
      const h = performance.now();
      u.existsSync(this.outputDir) || u.mkdirSync(this.outputDir, { recursive: !0 });
      const f = m.join(this.outputDir, this.outputFile);
      u.writeFileSync(f, r);
      const w = performance.now();
      return s.writingTime = w - h, s.totalTime = s.processingTime + s.renderingTime + s.writingTime, {
        success: !0,
        classCount: t.length,
        outputPath: f,
        metrics: s
      };
    } catch (i) {
      return this.logger.error(`Error generating CSS: ${i.message}`), {
        success: !1,
        error: i.message
      };
    }
  }
}
class R {
  constructor(e, s = {}) {
    this.extractor = e, this.dirs = s.dirs || ["./src"], this.filePatterns = s.filePatterns || ["**/*.{js,jsx,ts,tsx}"], this.ignorePatterns = s.ignorePatterns || ["**/node_modules/**", "**/dist/**"], this.logger = s.logger;
  }
  async init() {
    this.logger.info("Starting watch mode..."), this.logger.minimal || this.logger.info(`Watching directories: ${this.dirs.join(", ")}`), await this.extractor.run(), y.watch(this.dirs, {
      ignored: this.ignorePatterns,
      persistent: !0,
      ignoreInitial: !0
    }).on("add", async (s) => {
      this.shouldProcessFile(s) && this.logger.info(`File ${s} has been added`);
    }).on("change", async (s) => {
      this.shouldProcessFile(s) && (this.logger.info(`File ${s} has been changed`), await this.extractor.run());
    }).on("unlink", async (s) => {
      this.shouldProcessFile(s) && (this.logger.info(`File ${s} has been removed`), await this.extractor.run());
    }), this.logger.minimal || this.logger.info("Watching for changes...");
  }
  shouldProcessFile(e) {
    const s = m.extname(e).toLowerCase();
    return [".js", ".jsx", ".ts", ".tsx"].includes(s);
  }
}
function d(n) {
  return n < 1 ? `${(n * 1e3).toFixed(2)}μs` : n < 1e3 ? `${n.toFixed(2)}ms` : `${(n / 1e3).toFixed(2)}s`;
}
class O {
  constructor(e = {}) {
    this.verbose = e.verbose || !1, this.silent = e.silent || !1, this.minimal = e.minimal || !1, this.silent && this.minimal && (console.log(
      l.red(
        "Options 'silent' and 'minimal' can't both be true. Defaulting to 'silent: false'"
      )
    ), this.silent = !1);
  }
  log(e) {
    this.silent || console.log(e);
  }
  info(e) {
    this.silent || console.log(l.blue("ℹ") + " " + e);
  }
  success(e) {
    this.silent || console.log(l.green("✓") + " " + e);
  }
  warn(e) {
    this.silent || console.log(l.yellow("⚠") + " " + e);
  }
  error(e) {
    this.silent || console.error(l.red("✗") + " " + e);
  }
  debug(e) {
    this.verbose && !this.silent && console.log(l.gray("🔍 DEBUG:"), e);
  }
  performance(e, s) {
    if (!this.silent && this.minimal) {
      const i = `Generated ${s} class in ${d(e["Total time"])}`;
      console.log(l.green("✓") + " " + i);
    }
    !this.silent && !this.minimal && (console.log(`
` + l.blue("⚡ CSS Generation Performance:")), Object.entries(e).forEach(([i, t], o, a) => {
      const r = o === a.length - 1 ? "└─" : "├─";
      console.log(`${r} ${i}: ${d(t)}`);
    }));
  }
}
export {
  k as CSSGenerator,
  D as ClassNameExtractor,
  C as Extractor,
  v as FileScanner,
  R as FileWatcher,
  O as Logger
};
