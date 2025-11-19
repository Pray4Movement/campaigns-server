import { getDatabase } from './db'
import { appConfigService } from './app-config'
import { libraryContentService } from './library-content'

export interface PrayerContent {
  id: number
  campaign_id: number
  content_date: string
  language_code: string
  title: string
  content_json: string | null
  created_at: string
  updated_at: string
}

export interface CreatePrayerContentData {
  campaign_id: number
  content_date: string
  language_code: string
  title: string
  content_json?: any
}

export interface UpdatePrayerContentData {
  title?: string
  content_json?: any
  content_date?: string
  language_code?: string
}

export class PrayerContentService {
  private db = getDatabase()

  /**
   * Convert a date string to a day number based on global start date
   */
  private async dateToDayNumber(date: string): Promise<number> {
    const globalStartDate = await appConfigService.getConfig<string>('global_campaign_start_date')

    if (!globalStartDate) {
      throw new Error('Global campaign start date is not configured')
    }

    const startDate = new Date(globalStartDate)
    const targetDate = new Date(date)

    const diffTime = targetDate.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Day numbers start at 1, so add 1
    return diffDays + 1
  }

  /**
   * Convert a day number to a date string based on global start date
   */
  private async dayNumberToDate(dayNumber: number): Promise<string> {
    const globalStartDate = await appConfigService.getConfig<string>('global_campaign_start_date')

    if (!globalStartDate) {
      throw new Error('Global campaign start date is not configured')
    }

    const startDate = new Date(globalStartDate)
    // Day numbers start at 1, so subtract 1
    startDate.setDate(startDate.getDate() + (dayNumber - 1))

    return startDate.toISOString().split('T')[0]
  }

  /**
   * Get global library configuration
   */
  private async getGlobalLibraries(): Promise<Array<{ libraryId: number; order: number }>> {
    const globalConfig = await appConfigService.getConfig('global_campaign_libraries')

    if (!globalConfig || !globalConfig.campaignLibraries) {
      return []
    }

    return globalConfig.campaignLibraries
  }

  /**
   * Transform library content to prayer content format
   */
  private transformLibraryContent(libraryContent: any, campaignId: number, date: string): PrayerContent {
    return {
      id: libraryContent.id,
      campaign_id: campaignId,
      content_date: date,
      language_code: libraryContent.language_code,
      title: '', // Library content doesn't have titles, but keeping for compatibility
      content_json: libraryContent.content_json,
      created_at: libraryContent.created_at,
      updated_at: libraryContent.updated_at
    }
  }

  // ==========================================
  // READ OPERATIONS (Library-based)
  // ==========================================

  /**
   * Get prayer content by ID
   * Note: This is deprecated as content is now library-based, not campaign-specific
   */
  async getPrayerContentById(id: number): Promise<PrayerContent | null> {
    // This would need to search across all libraries, which is inefficient
    // For now, return null and log deprecation warning
    console.warn('getPrayerContentById is deprecated - content is now library-based')
    return null
  }

  /**
   * Get prayer content by campaign, date, and language
   * This now fetches from globally configured libraries
   * Returns only the FIRST content found
   */
  async getPrayerContentByDate(campaignId: number, date: string, languageCode: string = 'en'): Promise<PrayerContent | null> {
    try {
      // Convert date to day number
      const dayNumber = await this.dateToDayNumber(date)

      // Get global libraries
      const libraries = await this.getGlobalLibraries()

      if (libraries.length === 0) {
        return null
      }

      // Search libraries in order for content on this day in the requested language
      for (const libConfig of libraries) {
        const content = await libraryContentService.getLibraryContentByDay(
          libConfig.libraryId,
          dayNumber,
          languageCode
        )

        if (content) {
          return this.transformLibraryContent(content, campaignId, date)
        }
      }

      return null
    } catch (error) {
      console.error('Error getting prayer content by date:', error)
      return null
    }
  }

  /**
   * Get ALL prayer content for a specific date from ALL libraries
   * Returns array of content items (one from each library that has content for this day)
   */
  async getAllPrayerContentByDate(campaignId: number, date: string, languageCode: string = 'en'): Promise<PrayerContent[]> {
    try {
      // Convert date to day number
      const dayNumber = await this.dateToDayNumber(date)

      // Get global libraries
      const libraries = await this.getGlobalLibraries()

      if (libraries.length === 0) {
        return []
      }

      const allContent: PrayerContent[] = []

      // Collect content from ALL libraries for this day
      for (const libConfig of libraries) {
        const content = await libraryContentService.getLibraryContentByDay(
          libConfig.libraryId,
          dayNumber,
          languageCode
        )

        if (content) {
          allContent.push(this.transformLibraryContent(content, campaignId, date))
        }
      }

      // Sort by library order (libraries are already sorted by order in config)
      return allContent
    } catch (error) {
      console.error('Error getting all prayer content by date:', error)
      return []
    }
  }

  /**
   * Get all languages available for a specific campaign and date
   */
  async getAvailableLanguages(campaignId: number, date: string): Promise<string[]> {
    try {
      // Convert date to day number
      const dayNumber = await this.dateToDayNumber(date)

      // Get global libraries
      const libraries = await this.getGlobalLibraries()

      const languageSet = new Set<string>()

      // Collect languages from all libraries for this day
      for (const libConfig of libraries) {
        const languages = await libraryContentService.getAvailableLanguages(
          libConfig.libraryId,
          dayNumber
        )
        languages.forEach(lang => languageSet.add(lang))
      }

      return Array.from(languageSet).sort()
    } catch (error) {
      console.error('Error getting available languages:', error)
      return []
    }
  }

  /**
   * Get all prayer content for a campaign
   * This now fetches from globally configured libraries
   */
  async getCampaignPrayerContent(campaignId: number, options?: {
    startDate?: string
    endDate?: string
    language?: string
    limit?: number
    offset?: number
  }): Promise<PrayerContent[]> {
    try {
      // Get global libraries
      const libraries = await this.getGlobalLibraries()

      if (libraries.length === 0) {
        return []
      }

      // Convert dates to day numbers
      let startDay: number | undefined
      let endDay: number | undefined

      if (options?.startDate) {
        startDay = await this.dateToDayNumber(options.startDate)
      }

      if (options?.endDate) {
        endDay = await this.dateToDayNumber(options.endDate)
      }

      // Fetch content from all libraries
      const allContent: PrayerContent[] = []

      for (const libConfig of libraries) {
        const libraryContent = await libraryContentService.getLibraryContent(libConfig.libraryId, {
          startDay,
          endDay,
          language: options?.language
        })

        // Transform each library content item to prayer content format
        for (const item of libraryContent) {
          const date = await this.dayNumberToDate(item.day_number)
          allContent.push(this.transformLibraryContent(item, campaignId, date))
        }
      }

      // Sort by content_date DESC (like the old behavior)
      allContent.sort((a, b) => {
        if (a.content_date !== b.content_date) {
          return b.content_date.localeCompare(a.content_date)
        }
        return a.language_code.localeCompare(b.language_code)
      })

      // Apply limit and offset
      let result = allContent
      if (options?.offset) {
        result = result.slice(options.offset)
      }
      if (options?.limit) {
        result = result.slice(0, options.limit)
      }

      return result
    } catch (error) {
      console.error('Error getting campaign prayer content:', error)
      return []
    }
  }

  /**
   * Get prayer content grouped by date with language information
   */
  async getCampaignContentGroupedByDate(campaignId: number, options?: {
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Promise<Array<{ date: string; languages: string[] }>> {
    try {
      // Get global libraries
      const libraries = await this.getGlobalLibraries()

      if (libraries.length === 0) {
        return []
      }

      // Convert dates to day numbers
      let startDay: number | undefined
      let endDay: number | undefined

      if (options?.startDate) {
        startDay = await this.dateToDayNumber(options.startDate)
      }

      if (options?.endDate) {
        endDay = await this.dateToDayNumber(options.endDate)
      }

      // Collect all day numbers and their languages across libraries
      const dayMap = new Map<number, Set<string>>()

      for (const libConfig of libraries) {
        const grouped = await libraryContentService.getLibraryContentGroupedByDay(libConfig.libraryId, {
          startDay,
          endDay
        })

        grouped.forEach(({ dayNumber, languages }) => {
          if (!dayMap.has(dayNumber)) {
            dayMap.set(dayNumber, new Set())
          }
          languages.forEach(lang => dayMap.get(dayNumber)!.add(lang))
        })
      }

      // Convert day numbers back to dates
      const result: Array<{ date: string; languages: string[] }> = []

      for (const [dayNumber, languageSet] of dayMap.entries()) {
        const date = await this.dayNumberToDate(dayNumber)
        result.push({
          date,
          languages: Array.from(languageSet).sort()
        })
      }

      // Sort by date DESC
      result.sort((a, b) => b.date.localeCompare(a.date))

      // Apply limit and offset
      let finalResult = result
      if (options?.offset) {
        finalResult = finalResult.slice(options.offset)
      }
      if (options?.limit) {
        finalResult = finalResult.slice(0, options.limit)
      }

      return finalResult
    } catch (error) {
      console.error('Error getting campaign content grouped by date:', error)
      return []
    }
  }

  /**
   * Get content count for campaign
   */
  async getContentCount(campaignId: number): Promise<number> {
    try {
      // Get global libraries
      const libraries = await this.getGlobalLibraries()

      let totalCount = 0

      for (const libConfig of libraries) {
        const count = await libraryContentService.getContentCount(libConfig.libraryId)
        totalCount += count
      }

      return totalCount
    } catch (error) {
      console.error('Error getting content count:', error)
      return 0
    }
  }

  // ==========================================
  // WRITE OPERATIONS (Deprecated)
  // ==========================================

  /**
   * @deprecated Campaign-specific content creation is no longer supported.
   * Content should be created in libraries via the library management system.
   */
  async createPrayerContent(data: CreatePrayerContentData): Promise<PrayerContent> {
    throw new Error(
      'Campaign-specific content creation is deprecated. ' +
      'Please create content in libraries via /admin/libraries instead.'
    )
  }

  /**
   * @deprecated Campaign-specific content updates are no longer supported.
   * Content should be edited in libraries via the library management system.
   */
  async updatePrayerContent(id: number, data: UpdatePrayerContentData): Promise<PrayerContent | null> {
    throw new Error(
      'Campaign-specific content updates are deprecated. ' +
      'Please edit content in libraries via /admin/libraries instead.'
    )
  }

  /**
   * @deprecated Campaign-specific content deletion is no longer supported.
   * Content should be managed in libraries via the library management system.
   */
  async deletePrayerContent(id: number): Promise<boolean> {
    throw new Error(
      'Campaign-specific content deletion is deprecated. ' +
      'Please manage content in libraries via /admin/libraries instead.'
    )
  }
}

// Export singleton instance
export const prayerContentService = new PrayerContentService()
