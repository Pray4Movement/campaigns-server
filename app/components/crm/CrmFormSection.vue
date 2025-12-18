<template>
  <div class="crm-form-section">
    <div
      class="section-header"
      :class="{ clickable: collapsible }"
      @click="collapsible && toggle()"
    >
      <h3>{{ title }}</h3>
      <div class="header-right">
        <slot name="header-extra" />
        <UIcon
          v-if="collapsible"
          :name="isOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="section-icon"
        />
      </div>
    </div>

    <div v-if="isOpen" class="section-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  defaultOpen?: boolean
  collapsible?: boolean
}>(), {
  defaultOpen: true,
  collapsible: true
})

const emit = defineEmits<{
  toggle: [isOpen: boolean]
}>()

const isOpen = ref(props.defaultOpen)

function toggle() {
  isOpen.value = !isOpen.value
  emit('toggle', isOpen.value)
}

// Allow parent to control open state
watch(() => props.defaultOpen, (val) => {
  isOpen.value = val
})
</script>

<style scoped>
.crm-form-section {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: var(--ui-bg);
  transition: background-color 0.2s;
}

.section-header.clickable {
  cursor: pointer;
}

.section-header.clickable:hover {
  background-color: var(--ui-bg-elevated);
}

.section-header h3 {
  margin: 0;
  font-size: 0.9375rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  width: 1rem;
  height: 1rem;
  color: var(--ui-text-muted);
}

.section-content {
  padding: 1rem;
  border-top: 1px solid var(--ui-border);
}
</style>
