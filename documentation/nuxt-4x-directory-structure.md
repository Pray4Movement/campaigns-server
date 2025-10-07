# Nuxt 4.x Directory Structure

## App Directory

The `app/` directory contains the main application files and follows a specific structure for optimal organization.

### Key Subdirectories

#### `app/assets/`
- Store static assets like images, styles, and fonts
- Files are processed by build tools

#### `app/components/`
- Auto-import Vue components used across the application
- Components are automatically available without explicit imports

#### `app/composables/`
- Define reusable Vue composition functions
- Functions are auto-imported and available globally

#### `app/layouts/`
- Create different page layout structures
- Use `<NuxtLayout>` to apply layouts to pages

#### `app/middleware/`
- Define navigation middleware functions
- Control access and behavior during route transitions

#### `app/pages/`
- Optional directory for defining application routes
- Uses file-based routing system
- Use `<NuxtPage>` to render page components

#### `app/plugins/`
- Register Vue plugins and add global configurations
- Extend application functionality

#### `app/utils/`
- Store utility functions for auto-import throughout the app
- Helper functions available globally

### Special Files

#### `app/app.vue`
The main component of your Nuxt application - serves as the entry point

#### `app/app.config.ts`
Expose reactive configuration that can be updated at runtime

#### `app/error.vue`
Custom error page handling for application errors

### Key Characteristics

- **Optional directories** - Only create what you need
- **Minimal to complex** - Supports both simple and complex application structures  
- **Auto-imports** - Automatic imports and routing capabilities
- **Convention-based** - Follow naming conventions for automatic functionality