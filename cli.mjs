#!/usr/bin/env node
import { program } from 'commander'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import {
  Logger,
  FileScanner,
  CSSGenerator,
  ClassNameExtractor,
  FileWatcher
} from './dist/index.es.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJsonPath = path.resolve(__dirname, './package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const { description, version } = packageJson

program.name('txli').description(description).version(version)

program
  .option('-c, --config <path>', 'path to config file', 'tenoxui.config.js')
  .option('-i, --include <patterns>', 'glob patterns to include files (comma separated)')
  .option('-e, --exclude <patterns>', 'glob patterns to exclude files (comma separated)')
  .option('--ext, --extensions <patterns>', 'file extensions to allow', 'html,js,ts,jsx,tsx')
  .option('-d, --dir <path>', 'root directory', '.')
  .option('-o, --output-dir <path>', 'output directory', 'dist')
  .option('-f, --output-file <name>', 'output file name', 'index.css')
  .option('-w, --watch', 'watch mode', false)
  .option('-v, --verbose', 'verbose output', false)
  .option('-s, --silent', 'silent mode', false)
  .option('-m, --minimal', 'minimal mode', false)
  .parse()

async function main() {
  const options = program.opts()

  const logger = new Logger({
    verbose: options.verbose,
    silent: options.silent,
    minimal: options.minimal
  })
  let config = {
    include: ['**/*.{js,jsx,ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    extensions: ['.html', '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte'],
    rootDir: options.dir,
    outDir: options.outputDir,
    outputFile: options.outputFile,
    rules: [],
    css: {}
  }

  try {
    const configPath = path.resolve(options.config)

    logger.debug(`Found config file at: ${configPath}`)

    if (fs.existsSync(configPath)) {
      const userConfig = await import(configPath)

      config = { ...config, ...userConfig.default }

      logger.debug(`Loaded config from ${options.config}: ${JSON.stringify(config)}`)
    } else {
      logger.debug(`Config file not found at: ${configPath}`)
    }
  } catch (error) {
    logger.warn(`Could not load config file: ${error.message}`)
  }

  if (options.include) {
    config.include = options.include.split(',').map((p) => p.trim())
    logger.debug(`Override include patterns from CLI: ${config.include}`)
  }

  if (options.exclude) {
    config.exclude = options.exclude.split(',').map((p) => p.trim())
    logger.debug(`Override exclude patterns from CLI: ${config.exclude}`)
  }

  if (options.extensions) {
    config.extensions = options.extensions.split(',').map((p) => '.' + p.trim())

    logger.debug(`Override file extensions to reserve: ${config.extensions}`)
  }

  if (options.dir) {
    config.rootDir = options.dir
    logger.debug(`Override root directory from CLI: ${config.rootDir}`)
  }

  const scanner = new FileScanner(
    {
      include: config.include,
      exclude: config.exclude,
      rootDir: config.rootDir,
      rules: config.rules,
      cssConfig: config.css
    },
    logger
  )

  const generator = new CSSGenerator(
    {
      outputDir: config.outDir,
      outputFile: config.outputFile,
      tenoxui: config.css
    },
    logger
  )

  const extractor = new ClassNameExtractor({
    logger,
    scanner,
    generator
  })

  if (options.watch) {
    const watcher = new FileWatcher(extractor, {
      dirs: [config.rootDir],
      extensions: config.extensions,
      filePatterns: config.include,
      ignorePatterns: config.exclude,
      logger
    })

    await watcher.init()
  } else {
    logger.info('Running in build mode')
    await extractor.run()
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
