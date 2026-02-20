# Nuxt UI Modals

This guide explains how to properly implement modals using Nuxt UI's `UModal` component in this project.

## Basic Structure

Nuxt UI modals use a slot-based architecture. Content must be placed in named template slots:

```vue
<UModal v-model:open="isOpen" title="Modal Title">
  <template #body>
    <!-- Your modal content goes here -->
  </template>
</UModal>
```

## Available Slots

### `#body` (Most Common)
The main content area of the modal. Use this for forms, content, and interactive elements.

```vue
<UModal v-model:open="isOpen" title="Create Item">
  <template #body>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Name</label>
        <input v-model="form.name" type="text" />
      </div>
    </form>
  </template>
</UModal>
```

### `#header` (Optional)
Custom header content. Use when you need more control than the `title` prop provides.

```vue
<UModal v-model:open="isOpen">
  <template #header>
    <div class="custom-header">
      <h2>Custom Header</h2>
      <p>Subtitle text</p>
    </div>
  </template>
  <template #body>
    <!-- content -->
  </template>
</UModal>
```

### `#footer` (Optional)
Custom footer content. Useful for action buttons outside the form.

```vue
<UModal v-model:open="isOpen" title="Confirm Action">
  <template #body>
    <p>Are you sure?</p>
  </template>
  <template #footer>
    <div class="flex gap-2">
      <UButton @click="isOpen = false">Cancel</UButton>
      <UButton @click="confirm">Confirm</UButton>
    </div>
  </template>
</UModal>
```

### `#content` (Alternative)
For simple modals without structured layout. Renders raw content without header/body/footer divisions.

```vue
<UModal v-model:open="isOpen">
  <template #content>
    <div class="p-4">
      Simple content
    </div>
  </template>
</UModal>
```

## Controlling Modal State

### Using v-model:open

The recommended approach is to use `v-model:open` with a reactive boolean:

```vue
<script setup>
const isModalOpen = ref(false)

function openModal() {
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}
</script>

<template>
  <button @click="openModal">Open Modal</button>

  <UModal v-model:open="isModalOpen" title="My Modal">
    <template #body>
      <p>Content</p>
      <UButton @click="closeModal">Close</UButton>
    </template>
  </UModal>
</template>
```

### Computed Properties for Complex State

When modal visibility depends on multiple conditions:

```vue
<script setup>
const showCreateModal = ref(false)
const editingItem = ref(null)

const isModalOpen = computed({
  get: () => showCreateModal.value || !!editingItem.value,
  set: (value) => {
    if (!value) {
      showCreateModal.value = false
      editingItem.value = null
    }
  }
})
</script>

<template>
  <UModal v-model:open="isModalOpen" :title="editingItem ? 'Edit' : 'Create'">
    <template #body>
      <!-- form content -->
    </template>
  </UModal>
</template>
```

## Common Props

### `title`
Sets the modal header title (string):
```vue
<UModal title="Create Library">
```

### `description`
Adds descriptive text in the header (string):
```vue
<UModal title="Delete Item" description="This action cannot be undone">
```

### `v-model:open`
Controls modal visibility (boolean):
```vue
<UModal v-model:open="isOpen">
```

## Styling Modal Content

The `UModal` component provides the modal container, overlay, and animations. Style your content inside the slots:

```vue
<UModal v-model:open="isOpen" title="Styled Modal">
  <template #body>
    <div class="modal-content">
      <form class="space-y-4">
        <div class="form-group">
          <label class="block mb-2">Field</label>
          <input class="w-full p-2 border rounded" />
        </div>
      </form>
    </div>
  </template>
</UModal>

<style scoped>
.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}
</style>
```

## Using Nuxt UI Buttons

Always use `UButton` components for actions inside modals:

```vue
<template #body>
  <form @submit.prevent="handleSubmit">
    <!-- form fields -->

    <div class="flex gap-2 mt-4">
      <UButton type="button" variant="outline" @click="closeModal">
        Cancel
      </UButton>
      <UButton type="submit" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save' }}
      </UButton>
    </div>
  </form>
</template>
```

## Common Pitfalls

### ❌ Wrong: Content without slot
```vue
<!-- This won't display -->
<UModal v-model:open="isOpen">
  <p>This content won't show</p>
</UModal>
```

### ✅ Correct: Content in #body slot
```vue
<UModal v-model:open="isOpen">
  <template #body>
    <p>This content will show</p>
  </template>
</UModal>
```

### ❌ Wrong: Custom modal overlay
```vue
<!-- Don't create custom overlays -->
<div class="modal-overlay">
  <div class="modal">
    <!-- content -->
  </div>
</div>
```

### ✅ Correct: Use UModal
```vue
<UModal v-model:open="isOpen">
  <template #body>
    <!-- content -->
  </template>
</UModal>
```

## Complete Example

Here's a full working example of a create/edit modal:

```vue
<script setup lang="ts">
const showCreateModal = ref(false)
const editingItem = ref<Item | null>(null)
const saving = ref(false)

const isModalOpen = computed({
  get: () => showCreateModal.value || !!editingItem.value,
  set: (value: boolean) => {
    if (!value) closeModal()
  }
})

const form = ref({
  name: '',
  description: ''
})

function openCreateModal() {
  showCreateModal.value = true
}

function openEditModal(item: Item) {
  editingItem.value = item
  form.value = { ...item }
}

function closeModal() {
  showCreateModal.value = false
  editingItem.value = null
  form.value = { name: '', description: '' }
}

async function handleSubmit() {
  try {
    saving.value = true

    if (editingItem.value) {
      await $fetch(`/api/items/${editingItem.value.id}`, {
        method: 'PUT',
        body: form.value
      })
    } else {
      await $fetch('/api/items', {
        method: 'POST',
        body: form.value
      })
    }

    closeModal()
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <UButton @click="openCreateModal">Create Item</UButton>

    <UModal
      v-model:open="isModalOpen"
      :title="editingItem ? 'Edit Item' : 'Create Item'"
    >
      <template #body>
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div>
            <label class="block mb-2">Name</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label class="block mb-2">Description</label>
            <textarea
              v-model="form.description"
              rows="4"
              class="w-full p-2 border rounded"
            />
          </div>

          <div class="flex gap-2 justify-end">
            <UButton type="button" variant="outline" @click="closeModal">
              Cancel
            </UButton>
            <UButton type="submit" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save' }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
```

## Additional Resources

- [Nuxt UI Modal Documentation](https://ui.nuxt.com/components/modal)
- [Nuxt UI Button Documentation](https://ui.nuxt.com/components/button)
