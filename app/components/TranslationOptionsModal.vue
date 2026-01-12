<template>
  <UModal
    v-model:open="isOpen"
    title="Translate Content"
  >
    <template #body>
      <div class="translation-options-body">
        <!-- Source Language Selection -->
        <div class="form-group">
          <label class="form-label">Translate from</label>
          <USelect
            v-model="sourceLanguage"
            :items="availableSourceLanguages"
            value-key="code"
            label-key="label"
            placeholder="Select source language"
          />
        </div>

        <!-- Target Languages Display -->
        <div class="form-group">
          <label class="form-label">Translate to</label>
          <div v-if="mode === 'single'" class="target-language">
            <span class="language-flag">{{ getLanguageFlag(targetLanguage) }}</span>
            <span>{{ getLanguageName(targetLanguage) }}</span>
          </div>
          <div v-else class="target-languages-list">
            <div
              v-for="lang in targetLanguages"
              :key="lang"
              class="target-language-item"
            >
              <span class="language-flag">{{ getLanguageFlag(lang) }}</span>
              <span>{{ getLanguageName(lang) }}</span>
              <span v-if="existingLanguages.includes(lang)" class="existing-badge">
                exists
              </span>
            </div>
          </div>
        </div>

        <!-- Overwrite Option -->
        <div v-if="hasExistingContent" class="form-group">
          <UCheckbox
            v-model="overwrite"
            label="Overwrite existing translations"
          />
          <p class="help-text">
            {{ existingCount }} language(s) already have content. Check this box to replace them.
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="translation-modal-actions">
        <UButton
          @click="handleCancel"
          variant="outline"
        >
          Cancel
        </UButton>
        <UButton
          @click="handleTranslate"
          :loading="loading"
          :disabled="!sourceLanguage"
        >
          {{ loading ? 'Translating...' : 'Translate' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { LANGUAGES, getLanguageByCode } from '~/utils/languages'

interface Props {
  open?: boolean
  mode: 'single' | 'all'
  targetLanguage?: string
  availableLanguages: string[]
  existingLanguages?: string[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  existingLanguages: () => [],
  loading: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  translate: [options: { sourceLanguage: string; targetLanguages: string[]; overwrite: boolean }]
  cancel: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const sourceLanguage = ref('')
const overwrite = ref(false)

// Reset state when modal opens
watch(() => props.open, (newVal) => {
  if (newVal) {
    // Default to first available language (usually English)
    sourceLanguage.value = props.availableLanguages[0] || ''
    overwrite.value = false
  }
})

// Available source languages (only those with content)
const availableSourceLanguages = computed(() => {
  return props.availableLanguages.map(code => {
    const lang = getLanguageByCode(code)
    return {
      code,
      label: `${lang?.flag || ''} ${lang?.name || code}`
    }
  })
})

// Target languages (all except source)
const targetLanguages = computed(() => {
  if (props.mode === 'single' && props.targetLanguage) {
    return [props.targetLanguage]
  }
  return LANGUAGES
    .map(l => l.code)
    .filter(code => code !== sourceLanguage.value)
})

// Check if any target languages already have content
const hasExistingContent = computed(() => {
  return targetLanguages.value.some(lang => props.existingLanguages.includes(lang))
})

const existingCount = computed(() => {
  return targetLanguages.value.filter(lang => props.existingLanguages.includes(lang)).length
})

function getLanguageFlag(code: string): string {
  return getLanguageByCode(code)?.flag || '🌐'
}

function getLanguageName(code: string): string {
  return getLanguageByCode(code)?.name || code
}

function handleTranslate() {
  emit('translate', {
    sourceLanguage: sourceLanguage.value,
    targetLanguages: targetLanguages.value,
    overwrite: overwrite.value
  })
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped>
.translation-options-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.target-language {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--ui-bg-muted);
  border-radius: 0.375rem;
}

.target-languages-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.target-language-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--ui-bg-muted);
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.language-flag {
  font-size: 1rem;
}

.existing-badge {
  font-size: 0.75rem;
  color: var(--ui-text-muted);
  background: var(--ui-bg);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.help-text {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.translation-modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}
</style>
