<template>
  <div class="crm-page">
    <div class="page-header">
      <slot name="header" />
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-else class="crm-layout">
      <!-- Left Column: List Panel -->
      <div class="list-panel">
        <slot name="list-header" />
        <div class="list-items">
          <div v-if="loading" class="list-loading">Loading...</div>
          <slot v-else name="list">
            <div class="empty-list">
              <slot name="list-empty">No items found</slot>
            </div>
          </slot>
        </div>
      </div>

      <!-- Right Column: Detail Panel -->
      <div class="detail-panel">
        <slot name="detail">
          <div class="no-selection">
            <slot name="detail-empty">Select an item to view details</slot>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading?: boolean
  error?: string
}>()
</script>

<style scoped>
.crm-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.error {
  text-align: center;
  padding: 2rem;
  color: var(--ui-text-muted);
}

.list-loading {
  padding: 2rem;
  text-align: center;
  color: var(--ui-text-muted);
}

.crm-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  min-height: 600px;
}

.list-panel {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 150px);
}

.list-items {
  overflow-y: auto;
  flex: 1;
}

.empty-list {
  padding: 2rem;
  text-align: center;
  color: var(--ui-text-muted);
}

.detail-panel {
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background-color: var(--ui-bg-elevated);
  overflow-y: auto;
  max-height: calc(100vh - 150px);
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  color: var(--ui-text-muted);
}

@media (max-width: 1024px) {
  .crm-layout {
    grid-template-columns: 1fr;
  }

  .list-panel {
    max-height: 300px;
  }

  .detail-panel {
    max-height: none;
  }
}
</style>
