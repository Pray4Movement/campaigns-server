# Phase 3: Prayer Content Management - COMPLETE ✓

## Overview

Phase 3 implements the prayer content management system with media upload, date-specific content creation, and a complete CRUD interface for managing daily prayer content.

## Completed Tasks

### 1. Media Upload System ✓

**Files:**
- `server/utils/media.ts` - Media upload utilities
- `server/api/admin/media/upload.post.ts` - Media upload endpoint

**Features:**
- File upload to `/public/uploads/`
- UUID-based unique filenames
- Image validation (JPEG, PNG, GIF, WebP, max 10MB)
- Video validation (MP4, WebM, OGG, max 100MB)
- File type and size validation
- Returns file URL and metadata

**API:**
```
POST /api/admin/media/upload
Body: FormData with 'file' and 'type' (image|video)
Response: { success, file: { filename, url, size, mimeType } }
```

### 2. Prayer Content Service ✓

**File:** `server/database/prayer-content.ts`

**Data Models:**
- `PrayerContent` - Core content with date, title, text, scripture, prompts
- `Media` - Associated images/videos with display order
- `PrayerContentWithMedia` - Combined content + media

**Service Methods:**
- `createPrayerContent()` - Create content with optional media
- `getPrayerContentById()` - Get content with media
- `getPrayerContentByDate()` - Get content for specific campaign date
- `getCampaignPrayerContent()` - List content with filtering (date range, pagination)
- `updatePrayerContent()` - Update content fields
- `deletePrayerContent()` - Delete content (cascades to media)
- `addMedia()` - Add media to content
- `removeMedia()` - Remove media item
- `updateMediaOrder()` - Reorder media display
- `getContentCount()` - Count content for campaign

**Features:**
- Date-based content (specific calendar dates)
- Unique constraint on (campaign_id, content_date)
- Media with display ordering
- Full CRUD operations
- Pagination support

### 3. Prayer Content API Endpoints ✓

**Routes:**

**GET `/api/admin/campaigns/[campaignId]/content`**
- List all content for campaign
- Query params: startDate, endDate, limit, offset
- Returns content array with media
- Sorted by date descending

**POST `/api/admin/campaigns/[campaignId]/content`**
- Create new content
- Requires: title, content_date
- Optional: body_text, scripture_references, prayer_prompts, media array
- Validates unique date per campaign

**GET `/api/admin/campaigns/[campaignId]/content/[id]`**
- Get single content with media
- Returns 404 if not found

**PUT `/api/admin/campaigns/[campaignId]/content/[id]`**
- Update content
- All fields optional
- Can change date (validates uniqueness)

**DELETE `/api/admin/campaigns/[campaignId]/content/[id]`**
- Delete content and associated media
- Cascade delete from database

All endpoints require authentication.

### 4. Content Management UI ✓

**File:** `app/pages/admin/campaigns/[id]/content.vue`

**Features:**

**Content List View:**
- Shows all prayer content for campaign
- Displays: title, date, body text preview, scripture, media count
- Sorted by date (newest first)
- Empty state with create CTA
- Back link to campaigns

**Create/Edit Modal:**
- Date picker (HTML5 date input)
- Title field (required)
- Body text textarea (multi-line)
- Scripture references field
- Prayer prompts textarea
- All fields except date and title are optional
- Save/Cancel buttons
- Form validation

**Actions:**
- Add Content button (header)
- Edit content (pre-fills form)
- Delete content (with confirmation)
- Navigate back to campaigns

**UI/UX:**
- Clean card-based layout
- Truncated text previews
- Formatted dates (long format)
- Loading and error states
- Modal overlay with click-outside close
- Responsive design

### 5. Date Picker & Scheduling ✓

**Implementation:**
- HTML5 `<input type="date">` for native date picker
- ISO date format (YYYY-MM-DD)
- Date displayed in long format (e.g., "January 15, 2025")
- Unique constraint enforced per campaign
- Can edit/change dates

**Content Scheduling:**
- Content tied to specific calendar dates
- No end date (ongoing campaigns)
- Admins pre-create content for future dates
- Can create content in any order

### 6. Campaign Integration ✓

**Updates to Campaigns Page:**
- Added "Manage Content" button to each campaign card
- Links to `/admin/campaigns/[id]/content`
- Button positioned with Edit and Delete

**Navigation:**
- Campaigns → Manage Content → Content Management
- Back link returns to campaigns list
- Breadcrumb navigation

## Files Created/Modified

```
web/
├── server/
│   ├── utils/
│   │   └── media.ts                                    ✓ NEW
│   ├── database/
│   │   └── prayer-content.ts                           ✓ NEW
│   └── api/admin/
│       ├── media/
│       │   └── upload.post.ts                          ✓ NEW
│       └── campaigns/[campaignId]/content/
│           ├── index.get.ts                            ✓ NEW
│           ├── index.post.ts                           ✓ NEW
│           ├── [id].get.ts                             ✓ NEW
│           ├── [id].put.ts                             ✓ NEW
│           └── [id].delete.ts                          ✓ NEW
└── app/pages/admin/
    ├── campaigns.vue                                    ✓ UPDATED
    └── campaigns/[id]/
        └── content.vue                                  ✓ NEW
```

## How to Test Phase 3

### 1. Navigate to Campaigns
- Go to `/admin/campaigns`
- Click "Manage Content" on any campaign

### 2. Create Prayer Content
- Click "Add Content"
- Select a date
- Enter title (required)
- Add body text, scripture, prayer prompts
- Click "Save Content"

### 3. View Content List
- See content card with title and date
- Preview body text (truncated)
- View scripture and media count

### 4. Edit Content
- Click "Edit" on content card
- Modify any fields
- Change date if needed
- Save changes

### 5. Delete Content
- Click "Delete" on content card
- Confirm deletion
- Content removed from list

### 6. Test Date Uniqueness
- Try creating content for same campaign + date
- Should show error: "Content already exists for this campaign and date"

## Database Structure

**prayer_content table:**
- id, campaign_id, content_date (DATE)
- title, body_text, scripture_references, prayer_prompts
- created_at, updated_at
- UNIQUE constraint on (campaign_id, content_date)

**media table:**
- id, prayer_content_id, media_type, url, display_order
- Foreign key to prayer_content (CASCADE delete)

## Success Criteria ✓

All Phase 3 deliverables completed:
- ✓ Media upload system (images & videos)
- ✓ Prayer content CRUD interface
- ✓ Content management UI
- ✓ Date-specific content creation
- ✓ Rich content fields (title, text, scripture, prompts)
- ✓ Date picker for scheduling
- ✓ Content filtering and pagination

## Known Limitations

1. **No calendar view** - List view only, no visual calendar
2. **Media upload in UI** - Upload endpoint exists but not integrated in form yet
3. **No rich text editor** - Plain textarea for body text
4. **No content preview** - Can't preview how it looks to end users
5. **No bulk operations** - Create/edit one at a time
6. **No content duplication** - Can't copy content to another date

These can be enhanced in future iterations.

## Next Phase

**Phase 4: Public Campaign Landing Pages**
- Public campaign landing page template
- Campaign info display
- Signup form for reminders
- Links to mobile app
- Reminder preferences (delivery method, frequency, time)

See `/docs/reqs/web-reqs-phases.md` for complete roadmap.
