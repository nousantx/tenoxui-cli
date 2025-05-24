import chalk from 'chalk'
import { formatTime } from './performance.js'

export class Logger {
  constructor(options = {}) {
    this.verbose = options.verbose || false
    this.silent = options.silent || false
    this.minimal = options.minimal || false

    if (this.silent && this.minimal) {
      console.log(
        chalk.red(
          "Options 'silent' and 'minimal' can't both be true. Defaulting to 'silent: false'"
        )
      )
      this.silent = false
    }
  }

  log(message) {
    if (!this.silent) {
      console.log(message)
    }
  }

  info(message) {
    if (!this.silent) {
      console.log(chalk.blue('ℹ') + ' ' + message)
    }
  }

  success(message) {
    if (!this.silent) {
      console.log(chalk.green('✓') + ' ' + message)
    }
  }

  warn(message) {
    if (!this.silent) {
      console.log(chalk.yellow('⚠') + ' ' + message)
    }
  }

  error(message) {
    if (!this.silent) {
      console.error(chalk.red('✗') + ' ' + message)
    }
  }

  debug(message) {
    if (this.verbose && !this.silent) {
      console.log(chalk.gray('🔍 DEBUG:'), message)
    }
  }

  performance(metrics, count) {
    if (!this.silent && this.minimal) {
      const message = `Generated ${count} class in ${formatTime(metrics['Total time'])}`
      console.log(chalk.green('✓') + ' ' + message)
    }
    if (!this.silent && !this.minimal) {
      console.log('\n' + chalk.blue('⚡ CSS Generation Performance:'))
      Object.entries(metrics).forEach(([key, value], index, arr) => {
        const isLast = index === arr.length - 1
        const prefix = isLast ? '└─' : '├─'
        console.log(`${prefix} ${key}: ${formatTime(value)}`)
      })
    }
  }
}
