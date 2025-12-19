export interface UseCrmListOptions<T> {
  fetchFn: () => Promise<T[]>
  searchFields?: (keyof T)[]
  debounceMs?: number
}

export interface UseCrmListReturn<T> {
  items: Ref<T[]>
  filteredItems: ComputedRef<T[]>
  selectedItem: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string>
  searchQuery: Ref<string>
  loadData: () => Promise<void>
  selectItem: (item: T) => void
  clearSelection: () => void
  refreshItem: (id: number) => void
}

export function useCrmList<T extends { id: number }>(
  options: UseCrmListOptions<T>
): UseCrmListReturn<T> {
  const items = ref<T[]>([]) as Ref<T[]>
  const selectedItem = ref<T | null>(null) as Ref<T | null>
  const loading = ref(true)
  const error = ref('')
  const searchQuery = ref('')

  // Debounced search query for filtering
  const debouncedSearchQuery = ref('')
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  watch(searchQuery, (val) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    searchTimeout = setTimeout(() => {
      debouncedSearchQuery.value = val
    }, options.debounceMs ?? 300)
  })

  const filteredItems = computed(() => {
    if (!debouncedSearchQuery.value || !options.searchFields?.length) {
      return items.value
    }

    const query = debouncedSearchQuery.value.toLowerCase()
    return items.value.filter(item =>
      options.searchFields!.some(field => {
        const value = item[field]
        return value != null && String(value).toLowerCase().includes(query)
      })
    )
  })

  async function loadData() {
    try {
      loading.value = true
      error.value = ''
      items.value = await options.fetchFn()
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Failed to load data'
      console.error('useCrmList loadData error:', err)
    } finally {
      loading.value = false
    }
  }

  function selectItem(item: T) {
    selectedItem.value = item
  }

  function clearSelection() {
    selectedItem.value = null
  }

  function refreshItem(id: number) {
    const updated = items.value.find(item => item.id === id)
    if (updated && selectedItem.value?.id === id) {
      selectedItem.value = updated
    }
  }

  return {
    items,
    filteredItems,
    selectedItem,
    loading,
    error,
    searchQuery,
    loadData,
    selectItem,
    clearSelection,
    refreshItem
  }
}
