// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

const appTitle = process.env.APP_TITLE || 'Base'
const baseLayerUrl = process.env.BASE_LAYER_URL || 'github:corsacca/nuxt-base#master'

export default defineNuxtConfig({
  // Testing local base layer changes (switch back to github:corsacca/nuxt-base#TAG before deploying)
  extends: [baseLayerUrl], //  'github:corsacca/nuxt-base#master'

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: appTitle,
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
      ]
    }
  },

  modules: ['@nuxtjs/i18n', '@nuxt/icon'],

  i18n: {
    locales: [
      { code: 'en', name: 'English', files: ['en/common.json', 'en/people-groups.json', 'en/languages.json'] },
      { code: 'es', name: 'Español', files: ['es/common.json', 'es/people-groups.json', 'es/languages.json'] },
      { code: 'fr', name: 'Français', files: ['fr/common.json', 'fr/people-groups.json', 'fr/languages.json'] },
      { code: 'pt', name: 'Português', files: ['pt/common.json', 'pt/people-groups.json', 'pt/languages.json'] },
      { code: 'de', name: 'Deutsch', files: ['de/common.json', 'de/people-groups.json', 'de/languages.json'] },
      { code: 'it', name: 'Italiano', files: ['it/common.json', 'it/people-groups.json', 'it/languages.json'] },
      { code: 'zh', name: '中文', files: ['zh/common.json', 'zh/people-groups.json', 'zh/languages.json'] },
      { code: 'ar', name: 'العربية', dir: 'rtl', files: ['ar/common.json', 'ar/people-groups.json', 'ar/languages.json'] },
      { code: 'ru', name: 'Русский', files: ['ru/common.json', 'ru/people-groups.json', 'ru/languages.json'] },
      { code: 'hi', name: 'हिन्दी', files: ['hi/common.json', 'hi/people-groups.json', 'hi/languages.json'] }
    ],
    defaultLocale: 'en',
    langDir: 'locales',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'preferred_language',
      redirectOn: 'root',
      alwaysRedirect: true
    },
    vueI18n: './i18n.config.ts'
  },

  alias: {
    '#server': fileURLToPath(new URL('./server', import.meta.url))
  },

  nitro: {
    imports: {
      // Exclude server/utils/app from auto-imports to avoid conflicts with base layer
      // These utilities are accessed through server/utils re-exports only
      exclude: [
        '**/server/utils/app/**'
      ]
    }
  },

  runtimeConfig: {
    // Private keys (only available on the server-side)
    // Base layer config
    appName: appTitle,
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL || '',

    // Email configuration (base layer)
    smtpHost: process.env.SMTP_HOST || 'localhost',
    smtpPort: process.env.SMTP_PORT || '1025',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || 'noreply@localhost.com',
    smtpSecure: process.env.SMTP_SECURE || 'false',
    smtpRejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED || 'true',

    // S3 configuration (base layer)
    s3Endpoint: process.env.S3_ENDPOINT || '',
    s3Region: process.env.S3_REGION || '',
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    s3BucketName: process.env.S3_BUCKET_NAME || process.env.S3_BACKUP_BUCKET || '',

    // Disciple.Tools API
    dtPeopleGroupsApiUrl: process.env.DT_PEOPLE_GROUPS_API_URL || '',

    // DeepL Translation API
    deeplApiKey: process.env.DEEPL_API_KEY || '',
    deeplApiUrl: process.env.DEEPL_API_URL || 'https://api-free.deepl.com',

    // Public keys (exposed to the frontend)
    public: {
      appName: appTitle,
      nodeEnv: process.env.NODE_ENV || 'development',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  }
})
