# Phase 2: Campaign Management - COMPLETE ✓

## Overview

Phase 2 implements complete campaign management functionality, including CRUD operations, UI for managing campaigns, automatic slug generation, and basic role/permission structure.

## Completed Tasks

### 1. Campaign Service ✓

**File:** `server/database/campaigns.ts`

Implemented comprehensive campaign service with:
- `createCampaign()` - Create new campaigns with validation
- `getCampaignById()` - Fetch by ID
- `getCampaignBySlug()` - Fetch by slug
- `getAllCampaigns()` - List all campaigns with optional status filter
- `updateCampaign()` - Update campaign details
- `deleteCampaign()` - Delete campaigns (cascades to content)
- `getCampaignCount()` - Count campaigns by status
- `generateSlug()` - Generate URL-friendly slug from title
- `generateUniqueSlug()` - Ensure slug uniqueness with auto-increment
- `isSlugUnique()` - Validate slug uniqueness

**Features:**
- Automatic slug generation from title
- Slug uniqueness validation (with counter for duplicates)
- Status management (active/inactive)
- Full CRUD operations
- Error handling for constraints

### 2. Campaign API Endpoints ✓

**Admin API Routes:**

**GET `/api/admin/campaigns`**
- List all campaigns
- Optional status filter (`?status=active|inactive`)
- Returns campaigns array and count
- Requires authentication

**POST `/api/admin/campaigns`**
- Create new campaign
- Auto-generates slug if not provided
- Validates title requirement
- Returns created campaign
- Requires authentication

**GET `/api/admin/campaigns/[id]`**
- Get single campaign by ID
- Returns 404 if not found
- Requires authentication

**PUT `/api/admin/campaigns/[id]`**
- Update campaign
- Validates slug uniqueness
- Returns updated campaign
- Requires authentication

**DELETE `/api/admin/campaigns/[id]`**
- Delete campaign and all associated content (cascade)
- Returns 404 if not found
- Requires authentication

### 3. Campaign Management UI ✓

**File:** `app/pages/admin/campaigns.vue`

**Features Implemented:**

**Campaign List View:**
- Responsive grid layout (auto-fill, min 350px cards)
- Each card displays:
  - Title and status badge (active/inactive)
  - Description
  - Slug (monospace display)
  - Creation date
  - Edit and Delete buttons
- Empty state with "Create Campaign" CTA
- Loading state
- Error handling

**Create/Edit Modal:**
- Title field (required)
- Slug field (optional, auto-generated)
- Description textarea
- Status selector (active/inactive)
- Form validation
- Save/Cancel buttons
- Escape key to close
- Click outside to close

**Actions:**
- Create new campaign (modal form)
- Edit existing campaign (pre-fills form)
- Delete campaign (with confirmation)
- Auto-refresh after mutations

**UI/UX:**
- Status badges with color coding (green=active, red=inactive)
- Monospace slug display
- Formatted dates
- Loading states on save
- Error alerts
- Responsive design

### 4. Slug Generation & Validation ✓

**Auto-Generation Logic:**
- Converts title to lowercase
- Removes special characters
- Replaces spaces/underscores with hyphens
- Removes leading/trailing hyphens
- Example: "My Prayer Campaign!" → "my-prayer-campaign"

**Uniqueness Handling:**
- Checks database for existing slugs
- Auto-appends counter if duplicate: "slug-1", "slug-2", etc.
- Validates on create and update
- Excludes current campaign ID when updating

**Manual Slugs:**
- User can provide custom slug
- Validates uniqueness before save
- Returns error if slug already exists

### 5. Role & Permission Structure ✓

**File:** `server/database/roles.ts`

**Default Roles Created:**
- `admin` - Full system administrator (all permissions)
- `campaign_editor` - Can create and edit campaigns
- `content_creator` - Can create prayer content

**Permissions Defined:**
- `campaigns.create` - Create campaigns
- `campaigns.edit` - Edit campaigns
- `campaigns.delete` - Delete campaigns
- `campaigns.view` - View campaigns
- `content.create` - Create prayer content
- `content.edit` - Edit prayer content
- `content.delete` - Delete prayer content
- `users.manage` - Manage users
- `roles.manage` - Manage roles

**Service Methods:**
- `initializeDefaultRoles()` - Creates roles and permissions on startup
- `getAllRoles()` - List all roles
- `getRoleById()` - Get role details
- `getRolePermissions()` - Get permissions for role
- `getUserRoles()` - Get user's assigned roles
- `userHasPermission()` - Check if user has specific permission
- `assignRoleToUser()` - Assign role to user
- `removeRoleFromUser()` - Remove role from user

**Auto-Initialization:**
- Roles and permissions created on server start
- Admin role gets all permissions
- Campaign editor gets campaign.* permissions
- Safe re-run (INSERT OR IGNORE)

## Files Created/Modified

```
web/
├── server/
│   ├── database/
│   │   ├── campaigns.ts              ✓ NEW
│   │   └── roles.ts                  ✓ NEW
│   └── api/admin/campaigns/
│       ├── index.get.ts              ✓ NEW
│       ├── index.post.ts             ✓ NEW
│       ├── [id].get.ts               ✓ NEW
│       ├── [id].put.ts               ✓ NEW
│       └── [id].delete.ts            ✓ NEW
└── app/pages/admin/
    └── campaigns.vue                 ✓ UPDATED
```

## How to Test Phase 2

### 1. Start the application
```bash
cd web
npm run dev
```

### 2. Login as admin
- Navigate to http://localhost:3000/login
- Login with: admin@prayertools.com / admin123

### 3. Test Campaign Creation
- Go to Campaigns page
- Click "Create Campaign"
- Enter title: "Test Campaign"
- Observe auto-generated slug: "test-campaign"
- Save and verify card appears

### 4. Test Slug Generation
- Create another campaign with same title
- Slug should be "test-campaign-1"
- Create custom slug and verify uniqueness validation

### 5. Test Campaign Editing
- Click "Edit" on any campaign
- Modify title, description, status
- Save and verify changes appear

### 6. Test Campaign Deletion
- Click "Delete" on a campaign
- Confirm the dialog
- Verify campaign is removed

### 7. Test Role Initialization
Check the database for roles and permissions:
```bash
sqlite3 web/data/database.sqlite "SELECT * FROM roles;"
sqlite3 web/data/database.sqlite "SELECT * FROM permissions;"
sqlite3 web/data/database.sqlite "SELECT * FROM role_permissions WHERE role_id = 1;"
```

## API Testing

### Create Campaign
```bash
curl -X POST http://localhost:3000/api/admin/campaigns \
  -H "Content-Type: application/json" \
  -b "auth-token=<your-token>" \
  -d '{"title":"API Test Campaign","description":"Created via API"}'
```

### List Campaigns
```bash
curl http://localhost:3000/api/admin/campaigns \
  -b "auth-token=<your-token>"
```

### Update Campaign
```bash
curl -X PUT http://localhost:3000/api/admin/campaigns/1 \
  -H "Content-Type: application/json" \
  -b "auth-token=<your-token>" \
  -d '{"title":"Updated Title","status":"inactive"}'
```

### Delete Campaign
```bash
curl -X DELETE http://localhost:3000/api/admin/campaigns/1 \
  -b "auth-token=<your-token>"
```

## Database Structure

Campaigns are stored in the `campaigns` table:
- `id` - Auto-increment primary key
- `slug` - Unique URL slug
- `title` - Campaign title
- `description` - Campaign description
- `status` - 'active' or 'inactive'
- `created_at` - Timestamp
- `updated_at` - Timestamp

Indexes:
- `idx_campaigns_slug` on slug
- `idx_campaigns_status` on status

## Success Criteria ✓

All Phase 2 deliverables completed:
- ✓ Campaign CRUD operations
- ✓ Campaign management UI (list, create, edit, delete)
- ✓ Automatic slug generation
- ✓ Slug validation and uniqueness
- ✓ Campaign settings interface (status)
- ✓ Basic role/permission structure

## Next Phase

**Phase 3: Prayer Content Management**
- Media upload system
- Prayer content CRUD interface
- Calendar view for content scheduling
- Date picker for specific content
- Rich content editing (title, text, images, videos, scripture, prompts)

See `/docs/reqs/web-reqs-phases.md` for complete roadmap.

## Known Limitations

1. **No permission enforcement in UI** - UI doesn't check user permissions (will be Phase 7)
2. **No campaign-specific permissions** - Cannot assign editors to specific campaigns yet
3. **No bulk operations** - Cannot bulk delete/update campaigns
4. **No search/filter** - Cannot search campaigns by title

These will be addressed in future phases.
