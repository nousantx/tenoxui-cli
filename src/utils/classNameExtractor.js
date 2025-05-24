import Ngurai from 'nguraijs'
import { TenoxUI, constructRaw } from 'tenoxui'

export class Extractor {
  constructor(config = [], cssConfig = {}) {
    this.config = config
    this.cssConfig = cssConfig
    this.core = new TenoxUI(this.cssConfig)
  }
  extractClassNames(code) {
    try {
      // regexp patterns from Moxie
      const { all, prefix, type } = this.core.main.regexp(
        Object.keys(this.cssConfig.aliases || {}) || []
      )

      // tokenize class names using NguraiJS
      const nx = new Ngurai({
        customOnly: true,
        noUnknownToken: true,
        noSpace: true,
        custom: {
          className: [
            new RegExp(`!?${all.slice(1, -1)}`),
            new RegExp(`!?(?:(${prefix}):)?${type}`),
            ...this.config.map((reg) => {
              const source = reg.source
              return new RegExp(`!?${source}`, reg.flags)
            })
          ]
        }
      })

      // get every className tokens from the nx
      const classNames = [
        ...new Set(
          nx
            .tokenize(code)
            .flatMap((line) => line.filter((token) => token.type === 'className'))
            .map((token) => token.value)
        )
      ]

      const validatedClassNames = this.core
        .process(classNames)
        .map(
          (i) =>
            (i.isImportant ? '!' : '') +
            (i.rules ? constructRaw(i.raw[0], i.raw[1], '', '') : i.raw[6])
        )

      return validatedClassNames || []
    } catch (error) {
      console.error('Error extracting class names:', error)
      return []
    }
  }
}
