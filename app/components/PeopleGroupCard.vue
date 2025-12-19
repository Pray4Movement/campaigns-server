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
}

const props = defineProps<{
  peopleGroup: PeopleGroupData
}>()

function formatPopulation(population: number | null): string {
  if (!population) return ''
  return population.toLocaleString()
}

const mapEmbedUrl = computed(() => {
  const { lat, lng } = props.peopleGroup
  if (!lat || !lng) return null

  // Use OpenStreetMap embed - always available, no API key needed
  const bbox = `${lng - 15},${lat - 10},${lng + 15},${lat + 10}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
})
</script>

<template>
  <div class="people-group-card">
    <!-- Image -->
    <div v-if="peopleGroup.image_url" class="image-container">
      <img
        :src="peopleGroup.image_url"
        :alt="peopleGroup.name"
        class="people-group-image"
      />
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Name -->
      <h2 class="name">{{ peopleGroup.name }}</h2>

      <!-- Info row: Population, Language, Religion -->
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

      <!-- Description -->
      <p v-if="peopleGroup.description" class="description">
        {{ peopleGroup.description }}
      </p>

      <!-- Map -->
      <div v-if="mapEmbedUrl" class="map-container">
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
</template>

<style scoped>
.people-group-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.75rem;
  background-color: var(--ui-bg-elevated);
}

@media (min-width: 640px) {
  .people-group-card {
    flex-direction: row;
    align-items: flex-start;
    gap: 2rem;
  }
}

.image-container {
  flex-shrink: 0;
  width: 100%;
  max-width: 200px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .image-container {
    width: 160px;
    margin: 0;
  }
}

.people-group-image {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.5rem;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ui-text);
  margin: 0;
}

@media (max-width: 639px) {
  .name {
    text-align: center;
  }
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

@media (max-width: 639px) {
  .info-row {
    justify-content: center;
  }
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
  font-size: 1rem;
  line-height: 1.7;
  color: var(--ui-text);
  margin: 0;
}

@media (max-width: 639px) {
  .description {
    text-align: center;
  }
}

.map-container {
  margin-top: 0.5rem;
  border-radius: 0.5rem;
  overflow: hidden;
  max-width: 300px;
}

@media (max-width: 639px) {
  .map-container {
    margin-left: auto;
    margin-right: auto;
  }
}

.map-embed {
  width: 100%;
  height: 150px;
  display: block;
  border: none;
  border-radius: 0.5rem;
}
</style>
