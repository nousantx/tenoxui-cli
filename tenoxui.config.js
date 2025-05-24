module.exports = {
  include: ['index.html', 'app/**/*.{js,jsx,ts,tsx,html}'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  extensions: ['.html', '.css', '.astro'],
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
    }
  }
}
