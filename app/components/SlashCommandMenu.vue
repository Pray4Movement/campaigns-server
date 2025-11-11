<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'

interface Command {
  title: string
  description: string
  icon: string
  command: (props: any) => void
  group?: string
}

const props = defineProps<{
  items: Command[]
  command: (item: Command) => void
  query?: string
}>()

const selectedIndex = ref(0)

// Group items by their group property
const groupedItems = computed(() => {
  const groups: Record<string, Command[]> = {}

  props.items.forEach(item => {
    const group = item.group || 'Other'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
  })

  return groups
})

// Flatten items for keyboard navigation in the same order as visual display
const flatItems = computed(() => {
  const flattened: Command[] = []

  for (const groupName in groupedItems.value) {
    flattened.push(...groupedItems.value[groupName])
  }

  return flattened
})

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = (selectedIndex.value + flatItems.value.length - 1) % flatItems.value.length
    return true
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % flatItems.value.length
    return true
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    selectItem(selectedIndex.value)
    return true
  }

  return false
}

const selectItem = (index: number) => {
  const item = flatItems.value[index]
  if (item) {
    props.command(item)
  }
}

const getItemIndex = (item: Command) => {
  return flatItems.value.indexOf(item)
}

// Scroll selected item into view when selection changes
watch(selectedIndex, async () => {
  await nextTick()
  const activeButton = document.querySelector('.menu-button-active')
  if (activeButton) {
    activeButton.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    })
  }
})

watch(() => props.items, () => {
  selectedIndex.value = 0
})

defineExpose({
  onKeyDown
})
</script>

<template>
  <div class="slash-menu-card">
    <div class="slash-menu-body">
      <!-- No results message -->
      <div v-if="items.length === 0" class="no-results">
        <div class="no-results-icon">
          <Icon name="lucide:search-x" />
        </div>
        <div class="no-results-text">
          No blocks match "{{ query }}"
        </div>
      </div>

      <!-- Results grouped by category -->
      <template v-else>
        <template v-for="(groupItems, groupName, groupIndex) in groupedItems" :key="groupName">
          <div v-if="groupIndex > 0" class="menu-separator" />

          <div class="menu-group">
            <div class="menu-group-label">{{ groupName }}</div>
            <div class="menu-button-group">
              <button
                v-for="item in groupItems"
                :key="item.title"
                class="menu-button"
                :class="{ 'menu-button-active': getItemIndex(item) === selectedIndex }"
                @click="selectItem(getItemIndex(item))"
              >
                <div class="menu-button-icon">
                  <Icon :name="item.icon" />
                </div>
                <div class="menu-button-content">
                  <div class="menu-button-text">{{ item.title }}</div>
                </div>
              </button>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.slash-menu-card {
  min-width: 320px;
  max-width: 380px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -4px rgba(0, 0, 0, 0.1);
  z-index: 50;
}

.slash-menu-body {
  padding: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.menu-separator {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

.menu-group {
  display: flex;
  flex-direction: column;
}

.menu-group-label {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
}

.menu-button-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.menu-button {
  all: unset;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.menu-button:hover {
  background: #f9fafb;
}

.menu-button-active {
  background: #f3f4f6;
}

.menu-button-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  font-size: 18px;
  line-height: 1;
  color: #374151;
  background: #F9FAFB;
  border-radius: 6px;
}

.menu-button-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.menu-button-content {
  flex: 1;
  min-width: 0;
}

.menu-button-text {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  line-height: 1.5;
}

/* Scrollbar styling */
.slash-menu-body::-webkit-scrollbar {
  width: 6px;
}

.slash-menu-body::-webkit-scrollbar-track {
  background: transparent;
}

.slash-menu-body::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.slash-menu-body::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* No results message */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  text-align: center;
}

.no-results-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  color: #9ca3af;
  background: #f3f4f6;
  border-radius: 50%;
}

.no-results-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.no-results-text {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}
</style>
