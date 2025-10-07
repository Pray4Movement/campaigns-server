# Nuxt 4.x Styling Guide

## Styling Approaches

### 1. Local Stylesheets

#### Component-Level Import
```vue
<script setup>
import '~/app/assets/css/styles.css'
</script>
```

#### Global CSS via Config
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['~/app/assets/css/main.css']
})
```

#### Directory Structure
- Place stylesheets in `app/assets/` directory
- Files are processed by build tools
- Support for various formats (.css, .scss, .less, etc.)

### 2. Preprocessor Support

#### Installation
```bash
# SCSS/Sass
npm install -D sass

# Less  
npm install -D less

# Stylus
npm install -D stylus
```

#### Usage in Components
```vue
<style lang="scss" scoped>
$primary-color: #ff6b6b;

.button {
  background-color: $primary-color;
  &:hover {
    opacity: 0.8;
  }
}
</style>
```

### 3. Single File Component (SFC) Styling

#### Style Block Features
- **Scoped styles**: `<style scoped>`
- **CSS Modules**: `<style module>`
- **Dynamic styles**: `v-bind()` for reactive CSS
- **Multiple style blocks** per component

#### Example with Dynamic Styles
```vue
<script setup>
const primaryColor = ref('#ff6b6b')
</script>

<style scoped>
.button {
  background-color: v-bind(primaryColor);
}
</style>
```

### 4. PostCSS Integration

#### Built-in PostCSS Support
Nuxt includes these PostCSS plugins by default:
- **postcss-import** - Import resolution
- **postcss-url** - URL processing  
- **autoprefixer** - Vendor prefixes
- **cssnano** - CSS optimization (production)

#### Configuration
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  postcss: {
    plugins: {
      'postcss-nested': {},
      'postcss-custom-media': {}
    }
  }
})
```

### 5. Third-Party Libraries

#### Popular CSS Frameworks
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@unocss/nuxt',
    '@nuxt/ui',
    '@pandacss/dev'
  ]
})
```

#### Framework-Specific Setup
- **UnoCSS**: Atomic CSS engine
- **Tailwind CSS**: Utility-first framework
- **Nuxt UI**: Component library with styling
- **Panda CSS**: Build-time CSS-in-JS

## Advanced Features

### Font Optimization
- Automatic font loading optimization
- Support for Google Fonts integration
- Local font handling

### View Transitions API
- Native browser transitions
- Enhanced navigation experience
- Configurable transition effects

### Performance Optimization
- CSS code splitting
- Critical CSS inlining
- Lazy loading for non-critical styles

## Best Practices

1. **Use scoped styles** for component isolation
2. **Leverage PostCSS plugins** for enhanced CSS features
3. **Choose appropriate preprocessor** based on team preference
4. **Organize global styles** in dedicated CSS files
5. **Consider CSS-in-JS** for dynamic styling needs
6. **Test responsive designs** across different viewports
7. **Optimize for performance** with critical CSS strategies

## Configuration Tips

- Place global styles in `app/assets/css/`
- Use Nuxt config's `css` array for global imports
- Install preprocessors as dev dependencies
- Configure PostCSS for additional CSS processing
- Leverage Nuxt modules for popular CSS frameworks