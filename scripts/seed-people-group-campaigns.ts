#!/usr/bin/env tsx

import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

interface PeopleGroup {
  id: number
  dt_id: string
  name: string
  image_url: string | null
  metadata: string | null
}

// Load .env file
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env')
    const envContent = readFileSync(envPath, 'utf-8')

    envContent.split('\n').forEach(line => {
      if (!line || line.trim().startsWith('#')) return

      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        process.env[key.trim()] = value
      }
    })
  } catch (error) {
    console.warn('Could not load .env file:', error)
  }
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function seedPeopleGroupCampaigns() {
  // Load environment and connect to database
  loadEnv()

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('No DATABASE_URL found in environment variables.')
    process.exit(1)
  }

  const sql = postgres(databaseUrl, { max: 5 })

  try {
    await sql`SELECT NOW()`
    console.log('Database connection successful\n')

    // Fetch all people groups from the database
    const peopleGroups = await sql<PeopleGroup[]>`
      SELECT id, dt_id, name, image_url, metadata
      FROM people_groups
      ORDER BY name
    `

    console.log(`Found ${peopleGroups.length} people groups in database\n`)

    if (peopleGroups.length === 0) {
      console.log('No people groups found. Run the import first.')
      return
    }

    console.log('Creating campaigns...\n')

    let created = 0
    let skipped = 0

    for (const group of peopleGroups) {
      const title = group.name
      const baseSlug = generateSlug(title)

      // Check if a campaign already exists for this people group (by dt_id)
      const existingCampaign = await sql`
        SELECT id, title FROM campaigns WHERE dt_id = ${group.dt_id}
      `
      if (existingCampaign.length > 0) {
        console.log(`  Skipping "${title}" - campaign already exists (ID: ${existingCampaign[0].id})`)
        skipped++
        continue
      }

      // Check if slug exists and make unique if needed
      let slug = baseSlug
      let counter = 1
      while (true) {
        const existing = await sql`SELECT id FROM campaigns WHERE slug = ${slug}`
        if (existing.length === 0) break
        slug = `${baseSlug}-${counter}`
        counter++
      }

      // Create the campaign
      const result = await sql`
        INSERT INTO campaigns (slug, title, description, status, default_language, dt_id)
        VALUES (${slug}, ${title}, '', 'active', 'en', ${group.dt_id})
        RETURNING id
      `

      console.log(`  Created campaign "${title}" (ID: ${result[0].id}, slug: ${slug})`)
      created++
    }

    console.log(`\nCompleted: ${created} created, ${skipped} skipped`)

  } catch (error) {
    console.error('Failed to seed campaigns:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

seedPeopleGroupCampaigns().catch(console.error)
