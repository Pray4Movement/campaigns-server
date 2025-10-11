# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt.js 4.1.0 application with Vue 3, configured as an ES module project. The project uses TypeScript with Nuxt's automatic TypeScript configuration system.

## RULES
- NEVER EDIT THE .env file directly. Ask the user to.

## Development Commands

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Generate static site**: `npm run generate`
- **Preview production build**: `npm run preview`
- **Prepare Nuxt (post-install)**: `npm run postinstall`

## Project Structure

- `app/app.vue` - Main application entry point with theme toggle functionality
- `app/assets/css/main.css` - Global CSS with black/white theme variables
- `app/composables/useTheme.ts` - Theme management composable
- `nuxt.config.ts` - Nuxt configuration with devtools enabled, SSR disabled
- `tsconfig.json` - TypeScript configuration using Nuxt's reference system
- `public/` - Static assets (favicon, robots.txt)
- `documentation/` - Comprehensive Nuxt 4.1 documentation

## ⚠️ MANDATORY: Nuxt Routing Rules
**CRITICAL: Avoid routing conflicts in Nuxt file-based routing**
- **NEVER create both `pages/section.vue` AND `pages/section/[id]/page.vue`** - This creates routing conflicts
- **ALWAYS use nested structure**: `pages/section/index.vue` + `pages/section/[id]/page.vue`
- **Example conflict**: `pages/admin/users.vue` + `pages/admin/users/[id]/activity.vue` ❌
- **Correct structure**: `pages/admin/users/index.vue` + `pages/admin/users/[id]/activity.vue` ✅
- **When adding nested routes, move existing flat files to index.vue in subdirectory**

## Key Directories

- `app/assets/` - Static assets (images, styles, fonts)
- `app/components/` - Auto-imported Vue components
- `app/composables/` - Reusable composition functions
- `app/layouts/` - Page layout structures
- `app/pages/` - File-based routing
- `app/utils/` - Auto-imported utility functions

## Auto-Import Features

- Vue APIs (`ref`, `computed`, `onMounted`)
- Nuxt composables (`useFetch`, `useRoute`)
- Custom composables from `app/composables/`
- Components from `app/components/`
- Utilities from `app/utils/`

## Styling System

- Black and white theme system with light/dark mode support
- Do not use any colors
- Global CSS via `css: ['~/assets/css/main.css']` in nuxt.config.ts
- CSS custom properties for theme variables
- Theme toggle button in top-right corner
- LocalStorage persistence and system preference detection

## Styling Options

- Local stylesheets in components
- Global CSS via nuxt.config.ts
- Preprocessors (SCSS, Less, Stylus)
- PostCSS integration
- Third-party frameworks (Tailwind, UnoCSS, etc.)

## TypeScript Configuration

The project uses Nuxt's automatic TypeScript configuration system. The main `tsconfig.json` references generated configurations in `.nuxt/` directory:
- `.nuxt/tsconfig.app.json` - App-specific TypeScript config
- `.nuxt/tsconfig.server.json` - Server-side TypeScript config
- `.nuxt/tsconfig.shared.json` - Shared TypeScript config
- `.nuxt/tsconfig.node.json` - Node.js TypeScript config

## Nuxt Configuration

- Compatibility date: 2025-07-15
- Devtools enabled for development
- SSR disabled (SPA mode)
- Uses Nuxt 4.x with Vue 3.5+ and Vue Router 4.5+

## Documentation

Comprehensive Nuxt 4.1 documentation is available in the `documentation/` folder:
- `nuxt-4x-introduction.md` - Framework overview and key features
- `nuxt-4x-installation.md` - Installation guide and prerequisites
- `nuxt-4x-directory-structure.md` - App directory structure and organization
- `nuxt-4x-auto-imports.md` - Auto-import system for composables, components, and utils
- `nuxt-4x-styling.md` - Styling approaches, CSS imports, and preprocessors

For the most up-to-date information, refer to the official [Nuxt 4.x Documentation](https://nuxt.com/docs/4.x).