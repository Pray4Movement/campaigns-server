import type { VueI18n } from 'vue-i18n'

declare module '#app' {
  interface NuxtApp {
    $i18n: VueI18n
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: (key: string, values?: Record<string, any>) => string
    $tc: (key: string, choice?: number, values?: Record<string, any>) => string
    $te: (key: string) => boolean
    $d: (value: Date | number, key?: string, locale?: string) => string
    $n: (value: number, key?: string, locale?: string) => string
  }
}

export {}
