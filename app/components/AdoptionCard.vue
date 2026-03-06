<template>
  <div class="adoption-card">
    <div class="adoption-header" @click="expanded = !expanded">
      <div class="adoption-title">
        <NuxtLink v-if="linkTo" :to="linkTo" class="adoption-name-link" @click.stop>
          {{ label }}
        </NuxtLink>
        <span v-else class="adoption-name">{{ label }}</span>
        <UBadge
          :label="adoption.status"
          :color="adoption.status === 'active' ? 'success' : adoption.status === 'pending' ? 'warning' : 'neutral'"
          variant="outline"
          size="xs"
        />
      </div>
      <UIcon
        :name="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        class="expand-icon"
      />
    </div>

    <div v-if="expanded" class="adoption-details">
      <UFormField label="Status">
        <USelect
          :model-value="adoption.status"
          :items="statusOptions"
          value-key="value"
          class="w-full"
          @update:model-value="updateStatus($event as string)"
        />
      </UFormField>

      <UFormField label="Show Publicly">
        <UCheckbox
          :model-value="adoption.show_publicly"
          label="Show church name on people group page"
          @update:model-value="updateField('show_publicly', $event)"
        />
      </UFormField>

      <div v-if="adoption.adopted_at" class="info-row">
        <span class="label">Adopted:</span>
        <span class="value">{{ formatDate(adoption.adopted_at) }}</span>
      </div>

      <div class="info-row">
        <span class="label">Reports:</span>
        <span class="value">{{ adoption.report_count }}</span>
      </div>

      <div class="info-row">
        <span class="label">Update Link:</span>
        <div class="link-container">
          <span class="value link-text">{{ updateUrl }}</span>
          <UButton size="xs" variant="ghost" icon="i-lucide-copy" @click="copyLink" />
        </div>
      </div>

      <div v-if="adoption.report_count > 0" class="reports-section">
        <UButton size="xs" variant="outline" @click="loadReports">
          {{ reports ? 'Refresh Reports' : 'View Reports' }}
        </UButton>

        <div v-if="reports" class="reports-list">
          <div v-for="report in reports" :key="report.id" class="report-item">
            <div class="report-header">
              <UBadge
                :label="report.status"
                :color="report.status === 'approved' ? 'success' : report.status === 'rejected' ? 'error' : 'warning'"
                size="xs"
              />
              <span class="report-date">{{ formatDateTime(report.submitted_at) }}</span>
            </div>
            <div v-if="report.praying_count" class="report-field">
              Praying: {{ report.praying_count }}
            </div>
            <div v-if="report.stories" class="report-field">
              Stories: {{ report.stories }}
            </div>
            <div v-if="report.comments" class="report-field">
              Comments: {{ report.comments }}
            </div>
            <div class="report-actions">
              <UButton
                v-if="report.status !== 'approved'"
                size="xs" variant="outline" color="success"
                @click="updateReportStatus(report.id, 'approved')"
              >Approve</UButton>
              <UButton
                v-if="report.status !== 'rejected'"
                size="xs" variant="outline" color="error"
                @click="updateReportStatus(report.id, 'rejected')"
              >Reject</UButton>
            </div>
          </div>
        </div>
      </div>

      <div class="adoption-actions">
        <UButton size="xs" variant="outline" color="error" @click="$emit('delete', adoption.id)">
          Remove Adoption
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Adoption {
  id: number
  people_group_id: number
  group_id: number
  status: 'pending' | 'active' | 'inactive'
  update_token: string
  show_publicly: boolean
  adopted_at: string | null
  people_group_name: string
  people_group_slug: string | null
  group_name: string
  report_count: number
}

interface AdoptionReport {
  id: number
  adoption_id: number
  praying_count: number | null
  stories: string | null
  comments: string | null
  status: 'submitted' | 'approved' | 'rejected'
  submitted_at: string
}

const props = defineProps<{
  adoption: Adoption
  label: string
  linkTo?: string
}>()

const emit = defineEmits<{
  change: []
  delete: [id: number]
}>()

const toast = useToast()
const expanded = ref(false)
const reports = ref<AdoptionReport[] | null>(null)

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
]

const updateUrl = computed(() => {
  const baseUrl = import.meta.client ? window.location.origin : ''
  return `${baseUrl}/adoption/update/${props.adoption.update_token}`
})

async function updateStatus(status: string) {
  try {
    await $fetch(`/api/admin/groups/${props.adoption.group_id}/adoptions/${props.adoption.id}`, {
      method: 'PUT',
      body: { status }
    })
    emit('change')
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to update', color: 'error' })
  }
}

async function updateField(field: string, value: any) {
  try {
    await $fetch(`/api/admin/groups/${props.adoption.group_id}/adoptions/${props.adoption.id}`, {
      method: 'PUT',
      body: { [field]: value }
    })
    emit('change')
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to update', color: 'error' })
  }
}

async function loadReports() {
  try {
    const res = await $fetch<{ reports: AdoptionReport[] }>(
      `/api/admin/groups/${props.adoption.group_id}/adoptions/${props.adoption.id}/reports`
    )
    reports.value = res.reports
  } catch (err: any) {
    toast.add({ title: 'Error', description: 'Failed to load reports', color: 'error' })
  }
}

async function updateReportStatus(reportId: number, status: string) {
  try {
    await $fetch(`/api/admin/adoption-reports/${reportId}`, {
      method: 'PUT',
      body: { status }
    })
    await loadReports()
    toast.add({ title: 'Report updated', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.statusMessage || 'Failed to update', color: 'error' })
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(updateUrl.value)
    toast.add({ title: 'Copied!', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to copy', color: 'error' })
  }
}

function formatDate(d: string) { return new Date(d).toLocaleDateString() }
function formatDateTime(d: string) { return new Date(d).toLocaleString() }
</script>

<style scoped>
.adoption-card {
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  overflow: hidden;
}

.adoption-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: var(--ui-bg);
  cursor: pointer;
  transition: background-color 0.2s;
}

.adoption-header:hover {
  background-color: var(--ui-bg-elevated);
}

.adoption-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.adoption-name,
.adoption-name-link {
  font-weight: 500;
}

.adoption-name-link {
  color: var(--ui-text);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.expand-icon {
  width: 1rem;
  height: 1rem;
  color: var(--ui-text-muted);
}

.adoption-details {
  padding: 1rem;
  border-top: 1px solid var(--ui-border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.adoption-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid var(--ui-border);
  margin-top: 0.5rem;
}

.reports-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reports-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.report-item {
  padding: 0.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 4px;
  font-size: 0.8125rem;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.375rem;
}

.report-date {
  font-size: 0.75rem;
  color: var(--ui-text-muted);
}

.report-field {
  font-size: 0.8125rem;
  color: var(--ui-text-muted);
  margin-bottom: 0.25rem;
}

.report-actions {
  display: flex;
  gap: 0.375rem;
  margin-top: 0.375rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--ui-border);
  font-size: 0.875rem;
}

.info-row .label { font-weight: 500; }
.info-row .value { color: var(--ui-text-muted); }

.link-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.link-text {
  font-size: 0.75rem;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
