# Nuxt 4.1 Documentation

This folder contains comprehensive documentation for Nuxt 4.1 to help with development in this project.

## Documentation Files

### Getting Started
- **[nuxt-4x-introduction.md](./nuxt-4x-introduction.md)** - Overview and key features of Nuxt 4.x
- **[nuxt-4x-installation.md](./nuxt-4x-installation.md)** - Installation guide and prerequisites

### Development Guide
- **[nuxt-4x-directory-structure.md](./nuxt-4x-directory-structure.md)** - App directory structure and organization
- **[nuxt-4x-auto-imports.md](./nuxt-4x-auto-imports.md)** - Auto-import system for composables, components, and utils
- **[nuxt-4x-styling.md](./nuxt-4x-styling.md)** - Styling approaches, CSS imports, and preprocessors

## Quick Reference

### Key Directories
- `app/assets/` - Static assets (images, styles, fonts)
- `app/components/` - Auto-imported Vue components
- `app/composables/` - Reusable composition functions
- `app/layouts/` - Page layout structures
- `app/pages/` - File-based routing
- `app/utils/` - Auto-imported utility functions

### Auto-Import Features
- Vue APIs (`ref`, `computed`, `onMounted`)
- Nuxt composables (`useFetch`, `useRoute`)
- Custom composables from `app/composables/`
- Components from `app/components/`
- Utilities from `app/utils/`

### Styling Options
- Local stylesheets in components
- Global CSS via nuxt.config.ts
- Preprocessors (SCSS, Less, Stylus)
- PostCSS integration
- Third-party frameworks (Tailwind, UnoCSS, etc.)

## Usage Notes

These documentation files are meant to serve as a quick reference while developing with Nuxt 4.1. For the most up-to-date information, always refer to the official [Nuxt 4.x Documentation](https://nuxt.com/docs/4.x).

## Project Context

This documentation was created for the current project structure:
- Nuxt 4.1.0 application
- TypeScript support
- SSR disabled (SPA mode)
- Black and white theme system
- Auto-imported composables and components