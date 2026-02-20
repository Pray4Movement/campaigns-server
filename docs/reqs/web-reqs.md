# Web Application Requirements

## Overview
Prayer campaign platform built on Nuxt 4, enabling admins to create ongoing prayer campaigns with date-specific content. Public users can view prayer content, sign up for reminders, and track their prayer activity anonymously.

## Technology Stack
- Framework: Nuxt 4
- Base: Copy starter site from `/Users/jd/code/base`
- API Architecture: REST endpoints for CRUD operations and prayer fuel
- Authentication: Username/password + Google OAuth

## User Roles & Authentication

### Admin Users
- **Authentication Required**: Username/password or Google OAuth
- **Permissions**:
  - Create and manage campaigns
  - Create and edit daily prayer content
  - Edit campaign settings
  - Custom roles for campaign editing

### Public Users
- **Authentication Required**: None
- **Access**:
  - View campaign landing pages
  - View daily prayer fuel
  - Sign up for reminders (anonymous)
  - Mark "I prayed" (anonymous)

## Campaign Structure

### Campaign Properties
- Slug (for URL: `domain.com/campaign-slug`)
- Title
- Description
- Settings (configurable via admin interface)
- Status (active/inactive)
- No end date (ongoing campaigns)

### Daily Prayer Content
- **Date-specific**: Content created for specific calendar dates (e.g., January 15, 2025)
- **Multi-language support**: Each campaign can have content translated into multiple languages
- **Language structure**: Each date can have multiple language versions (stored as separate rows)
- **Must be pre-created**: Admins create content in advance
- **Content Editor**: Block-based WYSIWYG editor (Editor.js) with Gutenberg-like functionality
- **Content Storage**: JSON format for structured block content
- **Available Content Blocks**:
  - Headers (H2, H3, H4)
  - Paragraphs with rich text formatting (bold, italic, strikethrough, highlight)
  - Ordered and unordered lists
  - Checklists (for prayer points)
  - Blockquotes (styled for scripture verses with references)
  - Images (drag-and-drop upload, with captions)
  - Video embeds (YouTube, Vimeo, etc.)
  - Tables
  - Delimiters (section breaks)
  - Warning blocks (styled as prayer prompts)
  - Code blocks
  - Link previews

## Public Web Pages

### Campaign Landing Page
**URL**: `domain.com/campaign-slug`

**Components**:
- Campaign information section
- Signup form for reminders
- Links to mobile app
- Link to daily prayer fuel

**Signup Form Fields**:
- Name
- Email or Phone number
- Reminder delivery method (Email, WhatsApp, or Mobile App)
- Frequency (daily, weekly, custom)
- Time preference for reminders

### Prayer Fuel Page
**URL**: `domain.com/campaign-slug/prayer-fuel` or similar

**Functionality**:
- Display prayer content for current day (based on user's timezone/date)
- Show all content fields (title, text, images, videos, scripture, prompts)
- "I Prayed" button at bottom
- Track page duration (time page is open)

**Content Display Logic**:
- Determine "today" based on user's date/time passed to API
- Show content for current calendar date
- If no content exists for today, show appropriate message

## Admin Interface

### Campaign Management
- Create new campaigns
- Edit existing campaigns
- Configure campaign settings
- Assign custom roles/permissions for campaign editors
- View campaign statistics:
  - Total prayers
  - Prayers this month
  - Prayers today
  - Number of people who have prayed

### Content Management
- **Full-page editor interface** with sidebar for metadata (title, date)
- **Block-based content creation** using Editor.js
- **Multi-language content management**:
  - List view showing dates with language indicators (flags/badges)
  - Language switcher in editor to toggle between translations
  - Each language version stored as separate database row
  - Default language setting per campaign
- Create daily prayer content for specific dates
- Edit existing prayer content
- **Drag-and-drop image uploads** directly into content
- **Embed videos** from URLs (YouTube, Vimeo, etc.)
- **Image upload API** (`/api/upload/image`) with authentication
- **Link metadata fetching** for rich link previews
- Content stored as JSON (Editor.js format)
- View content list with title, date, and available languages

## Data Collection & Tracking

### Reminder Signups
**Stored Data**:
- Name
- Email or phone number
- Delivery method preference
- Frequency preference
- Time preference
- Campaign ID
- Signup timestamp

### Prayer Activity Tracking
**Stored Data** (separate table):
- Timestamp
- Duration (how long prayer fuel page was open)
- Campaign ID
- User identification (if available via email link ID)
- Anonymous if no user identification

**Identification Methods**:
- Email/WhatsApp notification links contain unique tracking ID
- No browser fingerprinting
- No session tracking for anonymous users

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Get Campaign List
```
GET /api/people-groups
```
**Response**: Array of active campaigns with basic info (id, slug, title, description)

#### Get Campaign Details
```
GET /api/people-groups/{slug}
```
**Response**: Full campaign details for landing page

#### Get Prayer Content for Today
```
GET /api/people-groups/{slug}/prayer-fuel
Query Parameters:
  - userDate: ISO 8601 date/time string (user's current date/time)
  - timezone: User's timezone (optional)
```
**Response**: Prayer content for the specified date, or appropriate message if none exists

#### Mark "I Prayed"
```
POST /api/people-groups/{slug}/prayed
Body:
  - userId: Tracking ID from email link (optional)
  - duration: Time spent on page in seconds
  - timestamp: ISO 8601 datetime
```
**Response**: Success confirmation

#### Submit Reminder Signup
```
POST /api/people-groups/{slug}/signup
Body:
  - name: string
  - email: string (if email delivery)
  - phone: string (if WhatsApp/SMS delivery)
  - deliveryMethod: enum [email, whatsapp, app]
  - frequency: string
  - timePreference: time string
```
**Response**: Success confirmation with unique tracking ID

### Admin Endpoints (Authentication Required)

#### People Group CRUD
```
GET /api/admin/people-groups
GET /api/admin/people-groups/{id}
PUT /api/admin/people-groups/{id}
```

#### Prayer Content CRUD
```
GET /api/admin/people-groups/{id}/content
GET /api/admin/people-groups/{id}/libraries

Query Parameters (for list):
  - startDate: Filter content from date
  - endDate: Filter content to date
  - language: Filter by language code (optional)
  - page: Pagination
  - limit: Results per page
```

**Multi-language Support**:
- Each prayer content row has a `language_code` field (e.g., 'en', 'es', 'fr')
- Unique constraint on (campaign_id, date, language_code)
- List endpoint returns content grouped by date with language indicators
- Create/update endpoints require language_code in body

#### Media Upload
```
POST /api/upload/image
Body: multipart/form-data with file (field name: 'image')
Response: Editor.js format { success: 1, file: { url: string } }

POST /api/upload/image-by-url
Body: { url: string }
Response: Editor.js format { success: 1, file: { url: string } }

POST /api/fetch-url-meta
Body: { url: string }
Response: Editor.js Link Tool format { success: 1, meta: { title, description, image } }
```
**Notes**:
- Images stored in `/public/uploads/images/`
- Requires authentication
- Supports JPEG, PNG, GIF, WebP

#### People Group Statistics
```
GET /api/admin/people-groups/{id}/stats
Query Parameters:
  - period: enum [today, month, all]
```
**Response**: Prayer statistics (count, unique users if trackable)

#### User/Role Management
```
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/{id}
DELETE /api/admin/users/{id}

GET /api/admin/roles
POST /api/admin/roles
PUT /api/admin/roles/{id}
DELETE /api/admin/roles/{id}
```

#### Reminder Subscriptions Management
```
GET /api/admin/people-groups/{id}/subscriptions
GET /api/admin/subscriptions/{id}
PUT /api/admin/subscriptions/{id}
DELETE /api/admin/subscriptions/{id}
```

## Integration Requirements

### Mobile App Integration
- Deep links to open specific campaigns
- REST endpoints accessible from mobile app
- Same prayer fuel endpoint used by web and mobile

### Email/WhatsApp Notifications
- Generate unique tracking IDs for each signup
- Include tracking ID in notification links
- Link format: `domain.com/campaign-slug/prayer-fuel?uid={trackingId}`
- Track which users came from notifications

## Database Schema Considerations

### Key Tables
- Campaigns (with default_language field)
- PrayerContent (with date and language_code fields)
- ReminderSignups
- PrayerActivity
- Users (admin)
- Roles/Permissions

### Important Fields
- Campaigns.default_language: VARCHAR (e.g., 'en', 'es', 'fr')
- PrayerContent.content_date: Calendar date (DATE type)
- PrayerContent.language_code: VARCHAR (e.g., 'en', 'es', 'fr')
- PrayerContent.title: Text
- PrayerContent.content_json: TEXT (JSON format - Editor.js blocks)
- PrayerActivity.duration: Integer (seconds)
- PrayerActivity.userId: Nullable (for anonymous tracking)
- ReminderSignups.trackingId: Unique identifier for notification links

### Multi-language Schema
- Each date can have multiple prayer content rows (one per language)
- Unique constraint: (campaign_id, content_date, language_code)
- Allows independent creation/editing of translations
- Better query performance and indexing than JSON array approach

**Note**: The `content_json` field stores structured block content in Editor.js JSON format. This replaces separate fields for body text, images, videos, scripture, and prompts - all content is now unified in the block structure.

## Non-Functional Requirements

### Performance
- Public pages must load quickly (no auth overhead)
- Prayer fuel API should handle timezone calculations efficiently
- Admin interface can prioritize functionality over speed

### Security
- Admin interface requires authentication
- Public endpoints rate-limited to prevent abuse
- Email/phone data encrypted at rest
- Tracking IDs should be unguessable (UUID recommended)

### Scalability
- Design for multiple concurrent campaigns
- Handle large volumes of anonymous prayer tracking
- Support bulk content creation for admins

### Privacy
- Minimal data collection for public users
- Anonymous prayer tracking by default
- Clear opt-in for reminder notifications
- No cross-site tracking or fingerprinting