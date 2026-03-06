<template>
  <div class="adoption-row">
    <div class="adoption-info" @click="$emit('open')">
      <span class="adoption-name">{{ label }}</span>
      <UBadge
        :label="adoption.status"
        :color="adoption.status === 'active' ? 'success' : adoption.status === 'pending' ? 'warning' : 'neutral'"
        variant="outline"
        size="xs"
      />
    </div>
    <UButton
      size="xs"
      variant="ghost"
      color="error"
      icon="i-lucide-x"
      @click="$emit('delete', adoption.id)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  adoption: { id: number; status: string }
  label: string
}>()

defineEmits<{
  open: []
  delete: [id: number]
}>()
</script>

<style scoped>
.adoption-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  background-color: var(--ui-bg);
}

.adoption-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  min-width: 0;
}

.adoption-info:hover .adoption-name {
  text-decoration: underline;
}

.adoption-name {
  font-weight: 500;
  text-underline-offset: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
