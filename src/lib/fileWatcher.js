import chokidar from 'chokidar'
import path from 'path'

export class FileWatcher {
  constructor(extractor, options = {}) {
    this.extractor = extractor
    this.dirs = options.dirs || ['./src']
    this.extensions = options.extensions || []
    this.filePatterns = options.filePatterns || ['**/*.{js,jsx,ts,tsx}']
    this.ignorePatterns = options.ignorePatterns || ['**/node_modules/**', '**/dist/**']
    this.logger = options.logger
  }

  async init() {
    this.logger.info('Starting watch mode...')
    if (!this.logger.minimal) this.logger.info(`Watching directories: ${this.dirs.join(', ')}`)

    await this.extractor.run()

    const watcher = chokidar.watch(this.dirs, {
      ignored: this.ignorePatterns,
      persistent: true,
      ignoreInitial: true
    })

    watcher
      .on('add', async (filepath) => {
        if (this.shouldProcessFile(filepath)) {
          this.logger.info(`File ${filepath} has been added`)
          // await this.extractor.run()
        }
      })
      .on('change', async (filepath) => {
        if (this.shouldProcessFile(filepath)) {
          this.logger.info(`File ${filepath} has been changed`)
          await this.extractor.run()
        }
      })
      .on('unlink', async (filepath) => {
        if (this.shouldProcessFile(filepath)) {
          this.logger.info(`File ${filepath} has been removed`)
          await this.extractor.run()
        }
      })

    if (!this.logger.minimal) this.logger.info('Watching for changes...')
  }

  shouldProcessFile(filepath) {
    const ext = path.extname(filepath).toLowerCase()
    return this.extensions.includes(ext)
  }
}
