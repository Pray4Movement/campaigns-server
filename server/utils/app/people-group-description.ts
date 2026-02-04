import { getFieldOptionLabel } from './field-options'

interface PeopleGroupMetadata {
  imb_isoalpha3?: string
  imb_population?: number | string
  imb_engagement_status?: string
  imb_gsec?: string | number  // GSEC 0-3 = Unreached
  imb_is_indigenous?: string | number
  imb_alternate_name?: string
  imb_reg_of_people_1?: string  // ROP1 - Affinity Bloc
  imb_reg_of_people_2?: string  // ROP2 - People Cluster
  imb_reg_of_religion?: string
  imb_reg_of_religion_3?: string
  imb_reg_of_language?: string
  [key: string]: any
}

interface PeopleGroupData {
  name: string
  people_desc?: string | null
  metadata: PeopleGroupMetadata
}

/**
 * Generates a description for a people group using a template and field values.
 *
 * Template:
 * The {name} of {country}, numbering approximately {population} people, are {engagementStatus}.
 * They are {peopleDesc}.
 * They are an {indigenousStatus} people, in the {affinityBloc} affinity bloc.
 * Their primary religion is {religion}.
 * They primarily speak {language}.
 */
export function generatePeopleGroupDescription(peopleGroup: PeopleGroupData): string {
  const { name, people_desc, metadata } = peopleGroup

  const parts: string[] = []

  // First sentence: name, country, population, engagement status
  const country = getFieldOptionLabel('imb_isoalpha3', metadata.imb_isoalpha3 || '') || metadata.imb_isoalpha3
  const population = metadata.imb_population ? Number(metadata.imb_population).toLocaleString() : null
  const engagementLabel = getFieldOptionLabel('imb_engagement_status', metadata.imb_engagement_status || '') || metadata.imb_engagement_status

  // GSEC 0-3 = Unreached (< 2% evangelical)
  const gsecValue = metadata.imb_gsec !== undefined ? Number(metadata.imb_gsec) : null
  const isUnreached = gsecValue !== null && gsecValue <= 3

  // Combine engagement status with unreached status
  let engagementStatus = engagementLabel
  if (engagementStatus && isUnreached) {
    engagementStatus = `${engagementStatus} and Unreached`
  }

  if (country && population && engagementStatus) {
    parts.push(`The ${name} of ${country}, numbering approximately ${population} people, are ${engagementStatus}.`)
  } else if (country && population) {
    parts.push(`The ${name} of ${country} number approximately ${population} people.`)
  } else if (population) {
    parts.push(`The ${name} number approximately ${population} people.`)
  }

  // Second sentence: people description (from imported CSV) with alternate names
  if (people_desc) {
    const altNames = metadata.imb_alternate_name
    if (altNames) {
      parts.push(`They are ${people_desc} and can also be known as ${altNames}.`)
    } else {
      parts.push(`They are ${people_desc}.`)
    }
  }

  // Third sentence: indigenous status, people cluster, and affinity bloc
  // imb_is_indigenous: "1" = Indigenous, "0" = Diaspora
  const indigenousRaw = metadata.imb_is_indigenous
  const indigenousStatus = indigenousRaw === '1' || indigenousRaw === 1 ? 'Indigenous' : indigenousRaw === '0' || indigenousRaw === 0 ? 'Diaspora' : null
  const peopleCluster = getFieldOptionLabel('imb_reg_of_people_2', metadata.imb_reg_of_people_2 || '') || null
  const affinityBloc = getFieldOptionLabel('imb_reg_of_people_1', metadata.imb_reg_of_people_1 || '') || null

  if (indigenousStatus && peopleCluster && affinityBloc) {
    const indigenousArticle = indigenousStatus.toLowerCase().startsWith('i') ? 'an' : 'a'
    parts.push(`They are ${indigenousArticle} ${indigenousStatus} people, in the ${peopleCluster} people cluster of the ${affinityBloc} affinity bloc.`)
  } else if (indigenousStatus && affinityBloc) {
    const indigenousArticle = indigenousStatus.toLowerCase().startsWith('i') ? 'an' : 'a'
    parts.push(`They are ${indigenousArticle} ${indigenousStatus} people, in the ${affinityBloc} affinity bloc.`)
  } else if (indigenousStatus) {
    const indigenousArticle = indigenousStatus.toLowerCase().startsWith('i') ? 'an' : 'a'
    parts.push(`They are ${indigenousArticle} ${indigenousStatus} people.`)
  } else if (affinityBloc) {
    parts.push(`They are in the ${affinityBloc} affinity bloc.`)
  }

  // Fourth sentence: religion
  const religion = getFieldOptionLabel('imb_reg_of_religion', metadata.imb_reg_of_religion || '')
    || getFieldOptionLabel('imb_reg_of_religion_3', metadata.imb_reg_of_religion_3 || '')
    || metadata.imb_reg_of_religion
  if (religion) {
    parts.push(`Their primary religion is ${religion}.`)
  }

  // Fifth sentence: language
  const language = getFieldOptionLabel('imb_reg_of_language', metadata.imb_reg_of_language || '') || metadata.imb_reg_of_language
  if (language) {
    parts.push(`They primarily speak ${language}.`)
  }

  return parts.join(' ')
}
