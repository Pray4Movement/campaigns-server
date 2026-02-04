class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  async tableExists(sql, tableName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ) as exists
    `
    return result[0]?.exists || false
  }

  async columnExists(sql, tableName, columnName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
      ) as exists
    `
    return result[0]?.exists || false
  }

  async indexExists(sql, indexName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = ${indexName}
      ) as exists
    `
    return result[0]?.exists || false
  }
}

export default class NormalizePeopleGroupsMigration extends BaseMigration {
  id = 33
  name = 'Normalize people groups with new columns'

  async up(sql) {
    console.log('📥 Normalizing people_groups table...')

    // Add country_code column (ISO Alpha-3)
    const countryCodeExists = await this.columnExists(sql, 'people_groups', 'country_code')
    if (!countryCodeExists) {
      await this.exec(sql, `
        ALTER TABLE people_groups
        ADD COLUMN country_code CHAR(3)
      `)
      console.log('  ✅ Added country_code column')
    } else {
      console.log('  ℹ️  country_code column already exists')
    }

    // Add region column
    const regionExists = await this.columnExists(sql, 'people_groups', 'region')
    if (!regionExists) {
      await this.exec(sql, `
        ALTER TABLE people_groups
        ADD COLUMN region TEXT
      `)
      console.log('  ✅ Added region column')
    } else {
      console.log('  ℹ️  region column already exists')
    }

    // Add latitude column
    const latitudeExists = await this.columnExists(sql, 'people_groups', 'latitude')
    if (!latitudeExists) {
      await this.exec(sql, `
        ALTER TABLE people_groups
        ADD COLUMN latitude DECIMAL(10, 8)
      `)
      console.log('  ✅ Added latitude column')
    } else {
      console.log('  ℹ️  latitude column already exists')
    }

    // Add longitude column
    const longitudeExists = await this.columnExists(sql, 'people_groups', 'longitude')
    if (!longitudeExists) {
      await this.exec(sql, `
        ALTER TABLE people_groups
        ADD COLUMN longitude DECIMAL(11, 8)
      `)
      console.log('  ✅ Added longitude column')
    } else {
      console.log('  ℹ️  longitude column already exists')
    }

    // Add population column
    const populationExists = await this.columnExists(sql, 'people_groups', 'population')
    if (!populationExists) {
      await this.exec(sql, `
        ALTER TABLE people_groups
        ADD COLUMN population INTEGER
      `)
      console.log('  ✅ Added population column')
    } else {
      console.log('  ℹ️  population column already exists')
    }

    // Add evangelical_pct column
    const evangelicalPctExists = await this.columnExists(sql, 'people_groups', 'evangelical_pct')
    if (!evangelicalPctExists) {
      await this.exec(sql, `
        ALTER TABLE people_groups
        ADD COLUMN evangelical_pct DECIMAL(5, 2)
      `)
      console.log('  ✅ Added evangelical_pct column')
    } else {
      console.log('  ℹ️  evangelical_pct column already exists')
    }

    // Add engagement_status column
    const engagementStatusExists = await this.columnExists(sql, 'people_groups', 'engagement_status')
    if (!engagementStatusExists) {
      await this.exec(sql, `
        ALTER TABLE people_groups
        ADD COLUMN engagement_status TEXT
      `)
      console.log('  ✅ Added engagement_status column')
    } else {
      console.log('  ℹ️  engagement_status column already exists')
    }

    // Add primary_religion column
    const primaryReligionExists = await this.columnExists(sql, 'people_groups', 'primary_religion')
    if (!primaryReligionExists) {
      await this.exec(sql, `
        ALTER TABLE people_groups
        ADD COLUMN primary_religion TEXT
      `)
      console.log('  ✅ Added primary_religion column')
    } else {
      console.log('  ℹ️  primary_religion column already exists')
    }

    // Add primary_language column
    const primaryLanguageExists = await this.columnExists(sql, 'people_groups', 'primary_language')
    if (!primaryLanguageExists) {
      await this.exec(sql, `
        ALTER TABLE people_groups
        ADD COLUMN primary_language TEXT
      `)
      console.log('  ✅ Added primary_language column')
    } else {
      console.log('  ℹ️  primary_language column already exists')
    }

    // Add descriptions column (JSONB for multi-language descriptions)
    const descriptionsExists = await this.columnExists(sql, 'people_groups', 'descriptions')
    if (!descriptionsExists) {
      await this.exec(sql, `
        ALTER TABLE people_groups
        ADD COLUMN descriptions JSONB DEFAULT '{}'::jsonb
      `)
      console.log('  ✅ Added descriptions column')
    } else {
      console.log('  ℹ️  descriptions column already exists')
    }

    // Migrate existing data from metadata to new columns
    console.log('  📦 Migrating data from metadata to new columns...')

    await this.exec(sql, `
      UPDATE people_groups
      SET
        country_code = COALESCE(country_code, (metadata::jsonb)->>'imb_isoalpha3'),
        region = COALESCE(region, (metadata::jsonb)->>'imb_region'),
        latitude = COALESCE(latitude, ((metadata::jsonb)->>'imb_lat')::DECIMAL(10, 8)),
        longitude = COALESCE(longitude, ((metadata::jsonb)->>'imb_lng')::DECIMAL(11, 8)),
        population = COALESCE(population, ((metadata::jsonb)->>'imb_population')::INTEGER),
        evangelical_pct = COALESCE(evangelical_pct, ((metadata::jsonb)->>'imb_evangelical_percentage')::DECIMAL(5, 2)),
        engagement_status = COALESCE(engagement_status, (metadata::jsonb)->>'imb_engagement_status'),
        primary_religion = COALESCE(primary_religion, (metadata::jsonb)->>'imb_reg_of_religion'),
        primary_language = COALESCE(primary_language, (metadata::jsonb)->>'imb_reg_of_language')
      WHERE metadata IS NOT NULL AND metadata != ''
    `)
    console.log('  ✅ Migrated data from metadata to new columns')

    // Migrate people_desc to descriptions->'en'
    console.log('  📦 Migrating people_desc to descriptions...')
    await this.exec(sql, `
      UPDATE people_groups
      SET descriptions = jsonb_set(
        COALESCE(descriptions, '{}'::jsonb),
        '{en}',
        to_jsonb(people_desc)
      )
      WHERE people_desc IS NOT NULL AND people_desc != ''
    `)
    console.log('  ✅ Migrated people_desc to descriptions')

    // Create indexes for frequently queried columns
    const countryCodeIndexExists = await this.indexExists(sql, 'idx_people_groups_country_code')
    if (!countryCodeIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_people_groups_country_code ON people_groups(country_code)
      `)
      console.log('  ✅ Created index on country_code')
    }

    const regionIndexExists = await this.indexExists(sql, 'idx_people_groups_region')
    if (!regionIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_people_groups_region ON people_groups(region)
      `)
      console.log('  ✅ Created index on region')
    }

    const engagementStatusIndexExists = await this.indexExists(sql, 'idx_people_groups_engagement_status')
    if (!engagementStatusIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_people_groups_engagement_status ON people_groups(engagement_status)
      `)
      console.log('  ✅ Created index on engagement_status')
    }

    const primaryReligionIndexExists = await this.indexExists(sql, 'idx_people_groups_primary_religion')
    if (!primaryReligionIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_people_groups_primary_religion ON people_groups(primary_religion)
      `)
      console.log('  ✅ Created index on primary_religion')
    }

    console.log('🎉 People groups normalization migration completed!')
  }
}
