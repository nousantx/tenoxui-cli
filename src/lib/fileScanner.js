import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import { Extractor } from '../utils/classNameExtractor.js'

export class FileScanner {
  constructor(options = {}, logger) {
    this.include = options.include || ['**/*.{js,jsx,ts,tsx}']
    this.exclude = options.exclude || ['**/node_modules/**', '**/dist/**', '**/build/**']
    this.rootDir = options.rootDir || '.'
    this.logger = logger
    this.extractor = new Extractor(options.rules, options.cssConfig)
  }

  /**
   * Scan files using glob patterns
   * @returns {Object} - Object with file paths as keys and arrays of class names as values
   */
  async scan() {
    const results = {}
    const scanStart = performance.now()

    try {
      // Convert single string pattern to array for consistency
      const includePatterns = Array.isArray(this.include) ? this.include : [this.include]
      const excludePatterns = Array.isArray(this.exclude) ? this.exclude : [this.exclude]

      this.logger.debug(`Scanning with patterns: ${includePatterns.join(', ')}`)
      this.logger.debug(`Excluding patterns: ${excludePatterns.join(', ')}`)
      this.logger.debug(`Root directory: ${this.rootDir}`)

      // Find all files matching the include patterns
      const files = await glob(includePatterns, {
        cwd: this.rootDir,
        ignore: excludePatterns,
        absolute: false // Change to false to use relative paths
      })

      this.logger.debug(`Found ${files.length} files to process: ${JSON.stringify(files)}`)

      // Process each file
      for (const relativeFilePath of files) {
        const absoluteFilePath = path.join(this.rootDir, relativeFilePath)

        try {
          this.logger.debug(`Reading file: ${absoluteFilePath}`)
          const content = fs.readFileSync(absoluteFilePath, 'utf8')
          const classNames = this.extractor.extractClassNames(content)

          if (classNames.length > 0) {
            results[absoluteFilePath] = classNames
            this.logger.debug(
              `Extracted ${classNames.length} classes from ${relativeFilePath}: ${classNames.join(
                ', '
              )}`
            )
          } else {
            this.logger.debug(`No classes found in ${relativeFilePath}`)
          }
        } catch (error) {
          this.logger.error(`Error processing ${absoluteFilePath}: ${error.message}`)
        }
      }
    } catch (error) {
      this.logger.error(`Error scanning files: ${error.message}`)
    }

    const scanEnd = performance.now()
    return { results, scanTime: scanEnd - scanStart }
  }
}
