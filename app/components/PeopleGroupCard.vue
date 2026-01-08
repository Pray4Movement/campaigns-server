<script setup lang="ts">
interface PeopleGroupData {
  name: string
  image_url: string | null
  description: string | null
  population: number | null
  language: string | null
  religion: string | null
  lat: number | null
  lng: number | null
  day_in_life_content?: Record<string, any> | null
  // Aspect cycling fields
  featured_aspect?: number // 1=map, 2=evangelicals, 3=status, 4=picture, 5=resources
  evangelical_percentage?: number | null
  engagement_status?: string | null
  congregation_existing?: string | null
  church_planting?: string | null
  bible_available?: string | null
  jesus_film_available?: string | null
  radio_broadcast_available?: string | null
  gospel_recordings_available?: string | null
  audio_scripture_available?: string | null
}

const props = defineProps<{
  peopleGroup: PeopleGroupData
  contentId?: string
}>()

function formatPopulation(population: number | null): string {
  if (!population) return ''
  return population.toLocaleString()
}

const mapEmbedUrl = computed(() => {
  const { lat, lng } = props.peopleGroup
  if (!lat || !lng) return null

  // Use OpenStreetMap embed - always available, no API key needed
  const numLat = Number(lat)
  const numLng = Number(lng)
  const bbox = `${numLng - 10},${numLat - 10},${numLng + 10},${numLat + 10}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${numLat},${numLng}`
})

const viewerItemId = computed(() => props.contentId || `people-group-${props.peopleGroup.name}`)

// Aspect cycling: default to showing map if no aspect specified (backwards compatible)
const featuredAspect = computed(() => props.peopleGroup.featured_aspect || 1)

// Calculate evangelical vs non-evangelical population
const evangelicalStats = computed(() => {
  const { population, evangelical_percentage } = props.peopleGroup
  if (!population || evangelical_percentage === null || evangelical_percentage === undefined) return null

  const evangelicals = Math.round(population * (evangelical_percentage / 100))
  const nonEvangelicals = population - evangelicals
  return {
    percentage: evangelical_percentage,
    evangelicals,
    nonEvangelicals
  }
})

// Resource availability helpers
const resources = computed(() => {
  const { bible_available, jesus_film_available, radio_broadcast_available, gospel_recordings_available, audio_scripture_available } = props.peopleGroup
  return [
    { key: 'bible', label: 'Bible', available: bible_available, icon: 'i-lucide-book-open' },
    { key: 'jesus_film', label: 'Jesus Film', available: jesus_film_available, icon: 'i-lucide-film' },
    { key: 'radio', label: 'Radio', available: radio_broadcast_available, icon: 'i-lucide-radio' },
    { key: 'gospel', label: 'Gospel Recordings', available: gospel_recordings_available, icon: 'i-lucide-mic' },
    { key: 'audio', label: 'Audio Scripture', available: audio_scripture_available, icon: 'i-lucide-headphones' }
  ]
})

function isResourceAvailable(value: string | null | undefined): boolean {
  if (!value) return false
  // Handle various "yes" indicators from IMB data
  return value === '1' || value === 'Y' || value.toLowerCase() === 'yes' || value.toLowerCase() === 'true'
}

function getEngagementStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Unknown'
  // Map common status codes to readable labels
  const statusMap: Record<string, string> = {
    '1': 'Unreached',
    '2': 'Minimally Reached',
    '3': 'Partially Reached',
    '4': 'Significantly Reached',
    '5': 'Reached'
  }
  return statusMap[status] || status
}

function getCongregationLabel(value: string | null | undefined): string {
  if (value === '1' || value === 'Y' || value?.toLowerCase() === 'yes') return 'Yes'
  if (value === '0' || value === 'N' || value?.toLowerCase() === 'no') return 'No'
  return 'Unknown'
}
</script>

<template>
  <div class="people-group-wrapper">
    <div class="people-group-card">
      <!-- Left column: Header + Description (always visible) -->
      <div class="left-column">
        <div class="header-row">
          <!-- Show small thumbnail unless aspect 4 (picture) is featured -->
          <div v-if="peopleGroup.image_url && featuredAspect !== 4" class="image-container">
            <img
              :src="peopleGroup.image_url"
              :alt="peopleGroup.name"
              class="people-group-image"
            />
          </div>

          <div class="header-content">
            <h2 class="name">{{ peopleGroup.name }}</h2>

            <div class="info-row">
              <div v-if="peopleGroup.population" class="info-item">
                <UIcon name="i-lucide-users" class="icon" />
                <span>{{ formatPopulation(peopleGroup.population) }}</span>
              </div>
              <div v-if="peopleGroup.language" class="info-item">
                <UIcon name="i-lucide-languages" class="icon" />
                <span>{{ peopleGroup.language }}</span>
              </div>
              <div v-if="peopleGroup.religion" class="info-item">
                <UIcon name="i-lucide-church" class="icon" />
                <span>{{ peopleGroup.religion }}</span>
              </div>
            </div>
          </div>
        </div>

        <p v-if="peopleGroup.description" class="description">
          {{ peopleGroup.description }}
        </p>
      </div>

      <!-- Right column: Featured aspect (cycles daily) -->
      <div class="aspect-container">
        <!-- Aspect 1: Map -->
        <div v-if="featuredAspect === 1 && mapEmbedUrl" class="aspect-map">
          <iframe
            :src="mapEmbedUrl"
            :title="`Map showing location of ${peopleGroup.name}`"
            class="map-embed"
            loading="lazy"
            frameborder="0"
            scrolling="no"
          />
        </div>

        <!-- Aspect 2: Evangelicals Visualization -->
        <div v-else-if="featuredAspect === 2" class="aspect-evangelicals">
          <h3 class="aspect-title">Spiritual Need</h3>
          <div v-if="evangelicalStats" class="evangelical-viz">
            <div class="population-bar">
              <div
                class="evangelical-segment"
                :style="{ width: `${evangelicalStats.percentage}%` }"
                :title="`${evangelicalStats.percentage}% Evangelical`"
              />
            </div>
            <div class="evangelical-legend">
              <div class="legend-item">
                <span class="legend-dot evangelical" />
                <span>Know Jesus: {{ formatPopulation(evangelicalStats.evangelicals) }} ({{ evangelicalStats.percentage }}%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot non-evangelical" />
                <span>Need to Hear: {{ formatPopulation(evangelicalStats.nonEvangelicals) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="no-data">
            <UIcon name="i-lucide-info" class="no-data-icon" />
            <span>Evangelical data not available</span>
          </div>
        </div>

        <!-- Aspect 3: Prayer/Engagement Status -->
        <div v-else-if="featuredAspect === 3" class="aspect-status">
          <h3 class="aspect-title">Prayer Status</h3>
          <div class="status-grid">
            <div class="status-card">
              <UIcon name="i-lucide-target" class="status-icon" />
              <span class="status-label">Engagement</span>
              <span class="status-value">{{ getEngagementStatusLabel(peopleGroup.engagement_status) }}</span>
            </div>
            <div class="status-card">
              <UIcon name="i-lucide-church" class="status-icon" />
              <span class="status-label">Churches Exist</span>
              <span class="status-value">{{ getCongregationLabel(peopleGroup.congregation_existing) }}</span>
            </div>
            <div v-if="peopleGroup.church_planting" class="status-card">
              <UIcon name="i-lucide-sprout" class="status-icon" />
              <span class="status-label">Church Planting</span>
              <span class="status-value">{{ peopleGroup.church_planting }}</span>
            </div>
          </div>
        </div>

        <!-- Aspect 4: Picture -->
        <div v-else-if="featuredAspect === 4" class="aspect-picture">
          <img
            v-if="peopleGroup.image_url"
            :src="peopleGroup.image_url"
            :alt="peopleGroup.name"
            class="featured-image"
          />
          <div v-else class="no-data">
            <UIcon name="i-lucide-image-off" class="no-data-icon" />
            <span>No image available</span>
          </div>
        </div>

        <!-- Aspect 5: Resources -->
        <div v-else-if="featuredAspect === 5" class="aspect-resources">
          <h3 class="aspect-title">Available Resources</h3>
          <div class="resources-grid">
            <div
              v-for="resource in resources"
              :key="resource.key"
              class="resource-item"
              :class="{ available: isResourceAvailable(resource.available), unavailable: !isResourceAvailable(resource.available) }"
            >
              <UIcon :name="resource.icon" class="resource-icon" />
              <span class="resource-label">{{ resource.label }}</span>
              <UIcon
                :name="isResourceAvailable(resource.available) ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                class="resource-status"
              />
            </div>
          </div>
        </div>

        <!-- Fallback: Map (for backwards compatibility) -->
        <div v-else-if="mapEmbedUrl" class="aspect-map">
          <iframe
            :src="mapEmbedUrl"
            :title="`Map showing location of ${peopleGroup.name}`"
            class="map-embed"
            loading="lazy"
            frameborder="0"
            scrolling="no"
          />
        </div>
      </div>
    </div>

    <!-- Day in the Life content section -->
    <div v-if="peopleGroup.day_in_life_content" class="day-in-life-section">
      <RichTextViewer
        :content="peopleGroup.day_in_life_content"
        :item-id="viewerItemId"
      />
    </div>
  </div>
</template>

<style scoped>
.people-group-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.people-group-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.day-in-life-section {
  margin-top: 1rem;
}

@media (min-width: 640px) {
  .people-group-card {
    flex-direction: row;
    align-items: stretch;
    gap: 1.5rem;
  }
}

/* Left column */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.header-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

@media (min-width: 640px) {
  .header-row {
    flex-direction: row;
    align-items: center;
  }
}

.image-container {
  flex-shrink: 0;
  width: 100px;
}

.people-group-image {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.5rem;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (max-width: 639px) {
  .header-content {
    align-items: center;
    text-align: center;
  }
}

.name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ui-text);
  margin: 0;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--ui-text-muted);
  font-size: 0.9375rem;
}

.info-item .icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.description {
  line-height: 1.7;
  color: var(--ui-text);
  margin: 0;
}

@media (max-width: 639px) {
  .description {
    text-align: center;
  }
}

/* Right column: Aspect container */
.aspect-container {
  flex-shrink: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  width: 100%;
}

@media (min-width: 640px) {
  .aspect-container {
    width: 300px;
  }
}

/* Aspect titles */
.aspect-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ui-text-muted);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Aspect 1: Map */
.aspect-map {
  height: 100%;
}

.map-embed {
  width: 100%;
  height: 180px;
  display: block;
  border: none;
  border-radius: 0.5rem;
}

@media (min-width: 640px) {
  .map-embed {
    height: 100%;
    min-height: 200px;
  }
}

/* Aspect 2: Evangelicals */
.aspect-evangelicals {
  padding: 1rem;
  background: var(--ui-bg-elevated);
  border-radius: 0.5rem;
  height: 100%;
}

.evangelical-viz {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.population-bar {
  height: 24px;
  background: var(--ui-bg-muted);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.evangelical-segment {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 12px;
  min-width: 2px;
  transition: width 0.3s ease;
}

.evangelical-legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--ui-text);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot.evangelical {
  background: #22c55e;
}

.legend-dot.non-evangelical {
  background: var(--ui-bg-muted);
  border: 2px solid var(--ui-border);
}

/* Aspect 3: Status */
.aspect-status {
  padding: 1rem;
  background: var(--ui-bg-elevated);
  border-radius: 0.5rem;
  height: 100%;
}

.status-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--ui-bg);
  border-radius: 0.375rem;
}

.status-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--ui-primary);
  flex-shrink: 0;
}

.status-label {
  font-size: 0.75rem;
  color: var(--ui-text-muted);
  flex-shrink: 0;
}

.status-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ui-text);
  margin-left: auto;
}

/* Aspect 4: Picture */
.aspect-picture {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.featured-image {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: cover;
  border-radius: 0.5rem;
}

@media (min-width: 640px) {
  .featured-image {
    height: 100%;
    min-height: 200px;
    max-height: none;
  }
}

/* Aspect 5: Resources */
.aspect-resources {
  padding: 1rem;
  background: var(--ui-bg-elevated);
  border-radius: 0.5rem;
  height: 100%;
}

.resources-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
}

.resource-item.available {
  background: rgba(34, 197, 94, 0.1);
  color: var(--ui-text);
}

.resource-item.unavailable {
  background: var(--ui-bg);
  color: var(--ui-text-muted);
}

.resource-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.resource-label {
  flex: 1;
}

.resource-status {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.resource-item.available .resource-status {
  color: #22c55e;
}

.resource-item.unavailable .resource-status {
  color: var(--ui-text-dimmed);
}

/* No data state */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--ui-text-muted);
  background: var(--ui-bg-elevated);
  border-radius: 0.5rem;
  height: 100%;
  min-height: 150px;
}

.no-data-icon {
  width: 2rem;
  height: 2rem;
  opacity: 0.5;
}
</style>
