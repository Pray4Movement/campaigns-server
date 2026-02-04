<template>
  <UTabs :items="languageTabs" class="w-full">
    <template #content="{ item }">
      <UTextarea
        :model-value="modelValue?.[item.code] || ''"
        @update:model-value="updateLanguage(item.code, $event)"
        :rows="rows"
        class="w-full mt-2"
      />
    </template>
  </UTabs>
</template>

<script setup lang="ts">
import { LANGUAGES } from '~/utils/languages'

const props = withDefaults(defineProps<{
  modelValue: Record<string, string> | null
  rows?: number
}>(), {
  rows: 3
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

const languageTabs = computed(() =>
  LANGUAGES.map(lang => ({
    label: `${lang.flag} ${lang.code.toUpperCase()}`,
    code: lang.code,
    badge: props.modelValue?.[lang.code] ? undefined : undefined
  }))
)

function updateLanguage(code: string, value: string) {
  const updated = { ...(props.modelValue || {}) }
  if (value) {
    updated[code] = value
  } else {
    delete updated[code]
  }
  emit('update:modelValue', updated)
}
</script>
