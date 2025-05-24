module.exports = {
  include: ['app/**/*.{js,jsx,ts,tsx}'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  outDir: 'css',
  css: {
    property: {
      flex: 'display: flex',
      bg: 'background'
    },
    variants: {
      dark: '@media (prefers-color-scheme: dark)',
      hover: '&:hover',
      focus: '&:focus'
    },
    aliases: {
      asdhjys7s73uj: 'bg-blue hover:bg-red'
    },
    apply: {
      body: 'bg-red dark:bg-blue flex items-center h-screen justify-center'
    },
    typeOrder: ['asdhjys7s73uj']
  }
}
