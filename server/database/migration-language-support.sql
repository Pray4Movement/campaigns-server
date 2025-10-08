-- Migration: Add language support to campaigns and prayer_content
-- This migration adds default_language to campaigns and language_code to prayer_content

-- Step 1: Add default_language column to campaigns table
ALTER TABLE campaigns ADD COLUMN default_language TEXT DEFAULT 'en' NOT NULL;

-- Step 2: Create backup of prayer_content table
CREATE TABLE prayer_content_backup AS SELECT * FROM prayer_content;

-- Step 3: Drop the old prayer_content table
DROP TABLE prayer_content;

-- Step 4: Recreate prayer_content table with language_code
CREATE TABLE prayer_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  content_date DATE NOT NULL,
  language_code TEXT DEFAULT 'en' NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  UNIQUE(campaign_id, content_date, language_code)
);

-- Step 5: Copy data back with language_code set to 'en'
INSERT INTO prayer_content (id, campaign_id, content_date, language_code, title, content_json, created_at, updated_at)
SELECT id, campaign_id, content_date, 'en', title, content_json, created_at, updated_at
FROM prayer_content_backup;

-- Step 6: Recreate indexes
CREATE INDEX idx_prayer_content_campaign_date ON prayer_content(campaign_id, content_date);
CREATE INDEX idx_prayer_content_date ON prayer_content(content_date);
CREATE INDEX idx_prayer_content_language ON prayer_content(language_code);

-- Step 7: Drop backup table
DROP TABLE prayer_content_backup;
