export default defineAppConfig({
  ui: {
    colors: {
      primary: 'forest',
      secondary: 'sage',
      neutral: 'beige'
    },
    button: {
      slots: {
        base: 'uppercase tracking-wide font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400'
      },
      variants: {
        size: {
          xs: { base: 'text-sm' },
          sm: { base: 'text-sm' },
          md: { base: 'text-base' },
          lg: { base: 'text-lg' },
          xl: { base: 'text-xl' }
        }
      }
    }
  }
})
