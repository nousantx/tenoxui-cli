export class ClassNameExtractor {
  constructor(options = {}) {
    this.logger = options.logger
    this.scanner = options.scanner
    this.generator = options.generator
  }

  async run() {
    if (!this.logger.minimal) this.logger.info('Starting class name extraction and CSS generation')

    const { results, scanTime } = await this.scanner.scan()
    const allClassNames = Object.values(results).flat()
    const generation = await this.generator.generate(allClassNames)

    if (generation.success) {
      const metrics = {
        'Scanning files': scanTime,
        'Processing classes': generation.metrics.processingTime,
        'Rendering CSS': generation.metrics.renderingTime,
        'Writing file': generation.metrics.writingTime,
        'Total time': generation.metrics.totalTime
      }

      this.logger.performance(metrics, generation.classCount)
      if (!this.logger.minimal) {
        this.logger.success(
          `Generated CSS with ${generation.classCount} unique classes at ${generation.outputPath}`
        )
      }

      return {
        success: true,
        classCount: generation.classCount,
        outputPath: generation.outputPath,
        metrics
      }
    } else {
      this.logger.error('Failed to generate CSS')
      return {
        success: false,
        error: generation.error
      }
    }
  }
}
