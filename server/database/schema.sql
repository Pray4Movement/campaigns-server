-- Users table (admin users)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT DEFAULT '' NOT NULL,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  superadmin BOOLEAN DEFAULT FALSE NOT NULL,
  token_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_token_key ON users(token_key);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  default_language TEXT DEFAULT 'en' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Prayer content table
CREATE TABLE IF NOT EXISTS prayer_content (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  content_date TEXT NOT NULL,
  language_code TEXT DEFAULT 'en' NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  UNIQUE(campaign_id, content_date, language_code)
);

CREATE INDEX IF NOT EXISTS idx_prayer_content_campaign_date ON prayer_content(campaign_id, content_date);
CREATE INDEX IF NOT EXISTS idx_prayer_content_date ON prayer_content(content_date);
CREATE INDEX IF NOT EXISTS idx_prayer_content_language ON prayer_content(language_code);


-- Reminder signups table
CREATE TABLE IF NOT EXISTS reminder_signups (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  tracking_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  delivery_method TEXT NOT NULL CHECK(delivery_method IN ('email', 'whatsapp', 'app')),
  frequency TEXT NOT NULL,
  days_of_week TEXT DEFAULT NULL,
  time_preference TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'unsubscribed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminder_signups_campaign ON reminder_signups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_reminder_signups_tracking_id ON reminder_signups(tracking_id);
CREATE INDEX IF NOT EXISTS idx_reminder_signups_status ON reminder_signups(status);

-- Prayer activity table
CREATE TABLE IF NOT EXISTS prayer_activity (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  tracking_id TEXT DEFAULT NULL,
  duration INTEGER DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prayer_activity_campaign ON prayer_activity(campaign_id);
CREATE INDEX IF NOT EXISTS idx_prayer_activity_tracking_id ON prayer_activity(tracking_id);
CREATE INDEX IF NOT EXISTS idx_prayer_activity_timestamp ON prayer_activity(timestamp);

-- User invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  invited_by INTEGER NOT NULL,
  role_id INTEGER DEFAULT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_invited_by ON user_invitations(invited_by);