# Translation System (i18n) Setup

This project uses `@nuxtjs/i18n` for internationalization with Weblate for translation management.

## Overview

- **i18n Module**: @nuxtjs/i18n (built on vue-i18n)
- **Translation Files**: JSON files in `/i18n/locales/` directory
- **Translation Management**: Weblate (file-based integration)
- **Supported Languages**: 10 languages (English, Spanish, French, Portuguese, German, Italian, Chinese, Arabic, Russian, Hindi)

## Supported Languages

| Code | Language | Native Name | File |
|------|----------|-------------|------|
| en | English | English | i18n/locales/en.json |
| es | Spanish | Español | i18n/locales/es.json |
| fr | French | Français | i18n/locales/fr.json |
| pt | Portuguese | Português | i18n/locales/pt.json |
| de | German | Deutsch | i18n/locales/de.json |
| it | Italian | Italiano | i18n/locales/it.json |
| zh | Chinese | 中文 | i18n/locales/zh.json |
| ar | Arabic | العربية | i18n/locales/ar.json |
| ru | Russian | Русский | i18n/locales/ru.json |
| hi | Hindi | हिन्दी | i18n/locales/hi.json |

## Using Translations in Your Code

### In Templates

```vue
<template>
  <div>
    <!-- Simple translation -->
    <h1>{{ $t('welcome') }}</h1>

    <!-- Nested translation -->
    <button>{{ $t('theme.toggle') }}</button>

    <!-- With parameters -->
    <p>{{ $t('greeting', { name: userName }) }}</p>
  </div>
</template>
```

### In Script Setup

```vue
<script setup lang="ts">
const { t, locale, setLocale } = useI18n()

// Use translation
const welcomeText = t('welcome')

// Get current locale
console.log(locale.value) // 'en', 'es', etc.

// Change locale
await setLocale('es')
</script>
```

### In Composables/Utils

```ts
export function useMyComposable() {
  const { t } = useI18n()

  const message = computed(() => t('common.loading'))

  return { message }
}
```

## Language Switching

The project includes a language selector in the default layout (`app/layouts/default.vue`). Users can switch languages using the dropdown in the header.

### Creating Language-Aware Links

When creating links in your templates, use `localePath()` to ensure URLs have the correct locale prefix:

```vue
<template>
  <!-- Instead of this -->
  <NuxtLink to="/about">About</NuxtLink>

  <!-- Use this -->
  <NuxtLink :to="localePath('/about')">About</NuxtLink>

  <!-- Results: /about (English) or /es/about (Spanish) -->
</template>
```

### Switching Between Languages

To create language switcher links:

```vue
<template>
  <div v-for="locale in availableLocales" :key="locale.code">
    <NuxtLink :to="switchLocalePath(locale.code)">
      {{ locale.name }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const availableLocales = computed(() => locales.value)
</script>
```

### Programmatic Navigation

```vue
<script setup lang="ts">
const { locale, setLocale } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

// Navigate to a page in current locale
await router.push(localePath('/about'))

// Change locale and navigate
await setLocale('es')
await router.push(localePath('/'))
</script>
```

Language preference is automatically:
- Saved to cookies (key: `preferred_language`)
- Detected from browser settings on first visit
- Persisted across sessions
- Reflected in URL structure

## Adding New Translation Keys

1. Add the key to `/i18n/locales/en.json` (the base language)
2. Add the same key to all other language files
3. Push changes to your repository
4. Weblate will detect the new keys and allow translators to add translations

Example:
```json
{
  "welcome": "Welcome",
  "newKey": "This is a new translation key"
}
```

## Weblate Integration

### Setup Steps

1. **Create a Weblate Project**
   - Go to your Weblate instance
   - Create a new project for "Prayer Tools"
   - Add a component for each language

2. **Connect to Git Repository**
   - In Weblate project settings, connect to your Git repository
   - Set the file format to "JSON"
   - Set the file mask to `locales/*.json`
   - Set the base language to English (en)

3. **Configure Git Integration**
   ```
   Repository URL: <your-git-repo-url>
   Repository branch: master (or main)
   File mask: i18n/locales/*.json
   File format: JSON
   Base file: i18n/locales/en.json
   ```

4. **Enable Auto-Commit**
   - Enable "Commit changes" in Weblate settings
   - Set commit message template: "i18n: Update translations from Weblate"
   - Weblate will automatically commit translation updates

### Workflow

1. **Developer adds new translation keys**
   - Add keys to all language files (at least to `en.json`)
   - Commit and push to repository

2. **Weblate syncs automatically**
   - Weblate pulls changes from repository
   - New keys appear for translators

3. **Translators work in Weblate**
   - Translators add/update translations in Weblate UI
   - Changes are committed to repository automatically

4. **Deploy updates**
   - Pull latest changes from repository
   - Translations are automatically included in build
   - No code changes needed

### Manual Sync (if needed)

If you need to manually sync:

```bash
# Pull latest translations from repository
git pull origin master

# Push new translation keys to repository
git add i18n/locales/*.json
git commit -m "i18n: Add new translation keys"
git push origin master
```

In Weblate, use the "Repository maintenance" options to:
- **Pull from repository**: Get latest changes from Git
- **Push to repository**: Send translations to Git
- **Reset repository**: Discard Weblate changes and reset to Git state

## Translation File Structure

All translation files follow the same JSON structure:

```json
{
  "welcome": "Welcome",
  "hello": "Hello",
  "language": "Language",
  "theme": {
    "toggle": "Toggle Theme",
    "light": "Light Mode",
    "dark": "Dark Mode"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "loading": "Loading..."
  }
}
```

### Naming Conventions

- Use lowercase with underscores for keys: `new_user`, `send_email`
- Group related translations using nested objects
- Keep keys descriptive and context-specific
- Common actions go in the `common` object

## URL Routing Strategy

This project uses `prefix_except_default` strategy:

- **English (default)**: `example.com/` or `example.com/about`
- **Spanish**: `example.com/es/` or `example.com/es/about`
- **French**: `example.com/fr/` or `example.com/fr/about`
- **Other languages**: `example.com/{locale}/`

### How It Works

1. **Default language (English)** has clean URLs without prefix
2. **All other languages** have language code prefix (e.g., `/es/`, `/fr/`)
3. **Browser detection** automatically redirects users to their preferred language on first visit
4. **Cookie persistence** remembers language choice across sessions
5. **SEO-friendly** - each language has its own URL

### Examples

```
/                  → English homepage
/about             → English about page
/es/               → Spanish homepage
/es/about          → Spanish about page
/fr/admin/users    → French admin users page
```

## Configuration

The i18n configuration is in `nuxt.config.ts`:

```typescript
i18n: {
  locales: [
    { code: 'en', name: 'English', file: 'en.json' },
    // ... other locales
  ],
  defaultLocale: 'en',
  lazy: true,
  langDir: 'locales',
  strategy: 'prefix_except_default',
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'preferred_language',
    redirectOn: 'root',
    alwaysRedirect: true
  }
}
```

### Configuration Options

- **locales**: Array of supported languages
- **defaultLocale**: Fallback language (English) - served without prefix
- **lazy**: Load translations on-demand (better performance)
- **langDir**: Directory containing translation files
- **strategy**: 'prefix_except_default' - default locale has no prefix, others do
- **detectBrowserLanguage**: Auto-detect and redirect to user's preferred language
- **alwaysRedirect**: Always redirect to detected language (not just on root)

## Best Practices

1. **Always add keys to all language files**
   - Even if you only have the English translation initially
   - Use English as a fallback for missing translations

2. **Keep translations short and clear**
   - Avoid complex sentences that are hard to translate
   - Consider context when writing keys

3. **Use pluralization when needed**
   ```json
   {
     "items": "No items | One item | {count} items"
   }
   ```

4. **Test in multiple languages**
   - Check text overflow in longer languages (German, Russian)
   - Verify RTL support for Arabic

5. **Document context for translators**
   - Add comments in Weblate for ambiguous keys
   - Provide screenshots when helpful

## Troubleshooting

### Translations not updating
- Clear Nuxt cache: `rm -rf .nuxt`
- Rebuild: `npm run dev`

### Weblate not syncing
- Check repository permissions in Weblate settings
- Verify webhook configuration (if using webhooks)
- Manually trigger sync in Weblate UI

### Missing translations
- Check if key exists in en.json
- Verify JSON syntax is valid
- Look for typos in translation keys

## Resources

- [@nuxtjs/i18n Documentation](https://i18n.nuxtjs.org/)
- [Weblate Documentation](https://docs.weblate.org/)
- [Vue I18n Documentation](https://vue-i18n.intlify.dev/)
