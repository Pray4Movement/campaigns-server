<template>
  <div class="crm-detail-panel">
    <div v-if="!hasSelection" class="no-selection">
      <slot name="empty">Select an item to view details</slot>
    </div>

    <div v-else class="details-content">
      <div class="details-header">
        <div class="header-info">
          <slot name="header" />
        </div>
        <div class="header-actions">
          <slot name="actions" />
        </div>
      </div>

      <div v-if="$slots['secondary-actions']" class="secondary-actions">
        <slot name="secondary-actions" />
      </div>

      <div class="details-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hasSelection?: boolean
}>()
</script>

<style scoped>
.crm-detail-panel {
  height: 100%;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  color: var(--ui-text-muted);
}

.details-content {
  padding: 1.5rem;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ui-border);
}

.header-info {
  flex: 1;
}

.header-info :deep(h2) {
  margin: 0 0 0.25rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.secondary-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ui-border);
}

.details-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.details-body :deep(form) {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
