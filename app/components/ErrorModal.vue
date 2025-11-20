<template>
  <UModal title="Error">
    <template #body>
      <p class="text-gray-700">{{ message }}</p>
    </template>
    <template #footer="{ close }">
      <UButton color="primary" class="ml-auto" @click="() => { close(); emit('close'); }">
        OK
      </UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
defineProps<{
  message: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
