# Nuxt 4.x Auto-Imports

## Overview

Nuxt automatically imports components, composables, helper functions, and Vue APIs based on usage, eliminating the need for explicit imports while preserving TypeScript support and tree-shaking.

## Auto-Import Sources

### 1. Built-in Framework Imports

- **Vue Reactivity APIs**: `ref`, `computed`, `reactive`, `watch`
- **Lifecycle hooks**: `onMounted`, `onUnmounted`, `beforeMount`
- **Nuxt-specific composables**: `useFetch()`, `useRoute()`, `useRouter()`

### 2. Directory-Based Imports

#### Components (`app/components/`)
- All Vue components are automatically available
- No need to import in templates
- Supports nested directory structure

#### Composables (`app/composables/`)
- Vue composition functions auto-imported
- Must follow naming convention (start with `use`)
- Available globally across the application

#### Utilities (`app/utils/`)
- Helper functions automatically imported
- Pure JavaScript/TypeScript functions
- Accessible throughout the app

## Configuration Options

### Disable All Auto-Imports
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    autoImport: false
  }
})
```

### Partially Disable Auto-Imports
```typescript
// nuxt.config.ts  
export default defineNuxtConfig({
  imports: {
    scan: false
  }
})
```

### Enable Third-Party Package Auto-Imports
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    presets: [
      // Add third-party package presets
    ]
  }
})
```

## Important Considerations

### Lifecycle Context
- Composables must be called in the correct Vue lifecycle context
- Some composables only work during specific phases

### Template Behavior  
- Refs won't automatically unwrap in component templates
- May need explicit `.value` access in some cases

### Explicit Imports
- Still possible using `#imports` alias when needed
- Useful for edge cases or specific requirements

## Best Practices

1. **Follow naming conventions** for automatic detection
2. **Organize files properly** in designated directories
3. **Use TypeScript** for better IDE support and type safety
4. **Test auto-import behavior** during development
5. **Consider explicit imports** for complex scenarios

## Benefits

- **Reduced boilerplate** - Less import statements to manage
- **Better DX** - Seamless development experience  
- **Type safety** - Full TypeScript support maintained
- **Tree-shaking** - Only used code included in production
- **IDE support** - Auto-completion and IntelliSense work perfectly