# Content Library System Requirements

## Overview

Rewrite the prayer fuel/content system from campaign-specific content management to a centralized library system. This allows content to be created once and shared across 2000+ campaigns, eliminating the need to manage content separately for each campaign.

## System Architecture

### Before (Current State)
- Each campaign has its own prayer fuel content
- Admin creates and manages content separately for each campaign
- Scaling to 2000+ campaigns would require managing content 2000+ times

### After (New State)
- Centralized content libraries
- Campaigns are configured to modularly use one or more libraries
- Content created once, used across multiple campaigns
- Global configuration for library assignment and ordering

---

## Existing Components & Utilities to Reuse

### Language System (`~/utils/languages.ts`)
- **`LANGUAGES`**: Array of all supported languages with code, name, nativeName, and flag
- **`getLanguageName(code)`**: Returns language name from code
- **`getLanguageFlag(code)`**: Returns flag emoji from code
- **`getLanguageByCode(code)`**: Returns full language object

### Components
- **`RichTextEditor`**: WYSIWYG editor component (currently used in campaign content creator)
- **Nuxt UI v4.1**: Use Nuxt UI components when possible for consistent design
  - `<UButton>` for buttons
  - `<UCard>` for card layouts
  - `<UModal>` for modals (see `documentation/nuxt-ui-modals.md` for implementation patterns)
  - `<UInput>` for text inputs
  - `<USelect>` or `<USelectMenu>` for dropdowns
  - `<UTable>` for data tables
  - Reference: https://ui.nuxt.com/components
- Existing language switcher component in LanguageSwitcher.vue

### Styling Patterns
- Use existing admin page layouts and styling patterns
- Prefer Nuxt UI components over custom HTML elements
- Sidebar navigation pattern from admin layout
- Card/table patterns from campaigns list (consider migrating to `<UCard>` and `<UTable>`)
- Editor layout pattern from content creator

---

## Feature 1: Library Management System

### 1.1 Library List Page (`/libraries`)

**Purpose**: Central hub for managing all content libraries

**Features**:
- Display list of all existing libraries
- Show library metadata (name, created date, content statistics)
- "Create New Library" button
- Edit/manage actions for each library

**UI Components** (use Nuxt UI):
- `<UTable>` for libraries list or `<UCard>` grid layout
- `<UButton>` for "Create New Library" action
- `<UInput>` with search icon for search/filter capabilities
- Table sorting if using `<UTable>`

### 1.2 Create Library Modal

**Trigger**: "Create New Library" button on `/libraries`

**Component**: Use `<UModal>` (see `documentation/nuxt-ui-modals.md`)

**Fields**:
- Library Name (`<UInput>` component, required)

**Actions**:
- Save (`<UButton>` primary): Creates new library and redirects to library editor
- Cancel (`<UButton>` variant="ghost"): Closes modal without creating

**Validation**:
- Name must be unique
- Name cannot be empty

---

## Feature 2: Library Content Editor

**Page Structure Overview**:
1. **Library Calendar View** (`/admin/libraries/[libraryId]`) - Shows all days with visual indicators
2. **Day Overview Page** (`/admin/libraries/[libraryId]/days/[dayNumber]`) - **Separate page** (NOT a modal) that shows all translations for a specific day
3. **Content Editor Page** (`/admin/libraries/[libraryId]/days/[dayNumber]/content/[contentId?]`) - Separate page for creating/editing content for a specific language

**IMPORTANT**: Clicking a day on the calendar should **navigate to a new page**, not open a modal.

### 2.1 Library Calendar View (`/admin/libraries/[libraryId]`)

**Purpose**: Navigate and manage daily content for a library (supports 365+ days)

**Calendar-Style View**:
- Visual representation of all days in the library
- Each day is clickable
- Visual indicator showing if content exists for that day
- Support for libraries of 365+ days (could be year-long or longer)

**Visual States**:
- **Has Content (All Languages)**: Green/filled indicator
- **Has Content (Some Languages)**: Partial/yellow indicator
- **No Content**: Empty/grey indicator

**Navigation**:
- Quick jump to specific day number (e.g., "Go to day 200")
- Pagination or scrollable calendar view
- Search/filter by day number

### 2.2 Language Filter

**Location**: Top of library calendar view page (`/admin/libraries/[libraryId]`)

**Implementation**: Use existing component form LanguageSwitcher.vue

**Filter States**:
- All Languages (`value=""`, default) - shows days with content in any language
- Specific Language (`value="en"`, `value="es"`, etc.) - shows only days with content in selected language

**Visual Update**:
- Calendar indicators update based on filter
- Days without content in selected language appear as "No Content"

### 2.3 Day Overview Page (`/admin/libraries/[libraryId]/days/[dayNumber]`)

**Purpose**: View and manage all translations for a specific day

**Route**: `/admin/libraries/[libraryId]/days/[dayNumber]`

**Trigger**: Click on a day in the calendar view - this should **navigate to this page** (using router navigation, NOT open a modal)

**Page Layout**:
- Breadcrumb navigation (Libraries > [Library Name] > Day [N])
- Day number header (e.g., "Day 1", "Day 200")
- Navigation buttons to previous/next day
- Back to calendar button

**Main Content**:
- List of existing translations for this day
- Each translation shows:
  - Language flag and name
  - Title
  - Content preview (first 100 characters)
  - Edit button
  - Delete button (`<UButton>` color="red" variant="ghost")

**Create New Translation**:
- "Add Translation" button (`<UButton>` primary)
- Triggers language selection modal/dropdown
- User selects language from available languages (excluding already translated languages)
- Redirects to content creation page for selected language

**UI Components** (use Nuxt UI):
- `<UCard>` for each translation
- `<UButton>` for actions (Add Translation, Edit, Delete)
- `<UBadge>` or flag emoji for language indicator
- Breadcrumbs for navigation

**Actions**:
- View list of all translations for the day
- Create new translation (redirects to 2.4)
- Edit existing translation (redirects to 2.4 with contentId)
- Delete translation
- Navigate to previous/next day

### 2.4 Content Creation/Editing Page (`/admin/libraries/[libraryId]/days/[dayNumber]/content/[contentId?]`)

**Purpose**: Create or edit content for a specific day and language

**Route**:
- Create: `/admin/libraries/[libraryId]/days/[dayNumber]/content/new?lang=[languageCode]`
- Edit: `/admin/libraries/[libraryId]/days/[dayNumber]/content/[contentId]`

**Page Layout**:
- Breadcrumb navigation (Libraries > [Library Name] > Day [N] > Edit/New)
- Page title: "Day [N] - [Language Name]" with flag
- Full-page editor layout

**Content Fields** (migrated from campaign content creator, use Nuxt UI components):
- Language display (read-only, shows flag and language name)
- Title field (`<UInput>` component, required)
- Prayer fuel content (rich text/WYSIWYG editor - use existing `RichTextEditor` component)

**Actions**:
- Save (`<UButton>` primary): Saves content and returns to day overview page
- Cancel (`<UButton>` variant="ghost"): Returns to day overview without saving
- Unsaved changes warning when navigating away

**UI Components** (use Nuxt UI):
- `<UInput>` for title
- `RichTextEditor` for content
- `<UButton>` for save/cancel actions
- Unsaved changes detection

### 2.5 Content Migration

**Task**: Move content creator from campaigns section to library content editor

**Components to Migrate from `/admin/campaigns/[id]/content/new.vue`**:
- Content editor UI layout (editor-page, editor-container, editor-main, editor-sidebar)
- `RichTextEditor` component for content editing
- Form structure with title and content
- Save/validation logic

**Key Changes**:
- **From**: `content_date` (specific date, e.g., "2025-01-15")
- **To**: `day_number` (sequential day, e.g., 1, 2, 3, 200)
- **From**: Campaign-specific content (`/api/admin/campaigns/{id}/content`)
- **To**: Library-specific content (`/api/admin/libraries/{id}/content`)
- **From**: Single page with language dropdown
- **To**: Language selection on day overview page, then dedicated content editor page

**Location Change**:
- From: `/admin/campaigns/[id]/content/new.vue` and `[contentId]/edit.vue`
- To:
  - Day overview: `/admin/libraries/[libraryId]/days/[dayNumber]`
  - Content editor: `/admin/libraries/[libraryId]/days/[dayNumber]/content/[contentId?]`

---

## Feature 3: Global Campaign Configuration

### 3.1 Campaign Library Configuration Page

**Purpose**: Define which libraries are available to all campaigns

**Location**: New global config page (e.g., `/admin/campaign-config` or `/settings/campaigns`)

**Features**:
- Select multiple libraries
- Define library order/priority
- Enable/disable libraries globally

**UI Components**:
- Library selection interface
- Drag-and-drop or numbered ordering
- Preview of library order

**Example Configuration**:
```
Library Order:
1. Morning Prayers Library
2. Scripture Reflections Library
3. Evening Devotions Library
```

**Actions**:
- Add library to configuration
- Remove library from configuration
- Reorder libraries
- Save configuration

### 3.2 Configuration Storage

**Data Structure**:
```typescript
{
  campaignLibraries: [
    { libraryId: 1, order: 1 },
    { libraryId: 2, order: 2 },
    { libraryId: 3, order: 3 }
  ]
}
```

---

## Feature 4: Campaign Content Display

### 4.1 Campaign Fuel/Content Pages

**New Behavior**:
- Display content from one or more configured libraries
- No local content creation/editing
- Read-only view of library content
- Content shown in configured library order

**Content Sources**:
- Content comes from globally configured libraries
- Campaign shows day content based on campaign timeline
- Multiple libraries can contribute content for same day

**UI Updates**:
- Remove content creator/editor
- Add "View in Library" link (navigates to library editor)
- Show which library each content piece comes from
- Clear indication that content is managed centrally

### 4.2 Removed Features

**No Longer in Campaigns**:
- L Content creator/editor
- L Add new prayer fuel
- L Edit prayer fuel
- L Delete prayer fuel
- L Language management per campaign

**Retained in Campaigns**:
-  View content
-  Navigate by day
-  Filter by language
-  Campaign metadata/settings (non-content)

---

## Data Model Changes

### New Tables/Collections

#### Libraries
```typescript
{
  id: number
  name: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### LibraryContent
```typescript
{
  id: number
  libraryId: number
  dayNumber: number  // 1, 2, 3, ... 365+
  language: string
  content: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### CampaignLibraryConfig
```typescript
{
  id: number
  libraryId: number
  order: number
  enabled: boolean
}
```

### Deprecated/Modified Tables

#### Campaign Prayer Fuel (old system)
- Mark as deprecated
- Possibly migrate existing data to libraries
- Remove content creation/editing references

---

## User Flows

### Flow 1: Create New Library with Content

1. Admin navigates to `/admin/libraries`
2. Clicks "Create New Library"
3. Enters library name in modal
4. Saves → redirects to library calendar view (`/admin/libraries/[id]`)
5. Calendar view shows all days (empty)
6. Clicks on "Day 1"
7. Navigates to Day 1 overview page (`/admin/libraries/[id]/days/1`)
8. Page shows "No translations yet"
9. Clicks "Add Translation"
10. Selects language (e.g., English) from dropdown/modal
11. Navigates to content creation page (`/admin/libraries/[id]/days/1/content/new?lang=en`)
12. Enters title and content
13. Clicks Save
14. Returns to Day 1 overview page, now showing English translation
15. Optionally adds more translations or navigates back to calendar
16. Calendar updates to show Day 1 has content
17. Repeats for additional days

### Flow 2: Edit Existing Day Content

1. Admin navigates to library calendar view (`/admin/libraries/[id]`)
2. Uses calendar view to find day (e.g., scrolls to Day 200)
3. Clicks on Day 200
4. Navigates to Day 200 overview page (`/admin/libraries/[id]/days/200`)
5. Sees list of existing translations (e.g., English, Spanish)
6. Clicks "Edit" on Spanish translation
7. Navigates to content editing page (`/admin/libraries/[id]/days/200/content/[contentId]`)
8. Edits title and/or content
9. Clicks Save
10. Returns to Day 200 overview page with updated content
11. Navigates back to calendar view

### Flow 3: Find Days Missing Content in Spanish

1. Admin navigates to library calendar view (`/admin/libraries/[id]`)
2. Sets language filter to "Spanish"
3. Calendar view updates
4. Days without Spanish content appear empty/grey
5. Days with Spanish content appear filled/green
6. Admin clicks on empty day (e.g., Day 50)
7. Navigates to Day 50 overview page (`/admin/libraries/[id]/days/50`)
8. Sees existing translations in other languages but not Spanish
9. Clicks "Add Translation"
10. Selects "Spanish" from language dropdown
11. Navigates to content creation page (`/admin/libraries/[id]/days/50/content/new?lang=es`)
12. Enters Spanish title and content
13. Clicks Save
14. Returns to Day 50 overview page, now showing Spanish translation

### Flow 4: Configure Libraries for Campaigns

1. Admin navigates to global campaign config page
2. Views current library configuration
3. Adds "Morning Prayers Library"
4. Adds "Scripture Reflections Library"
5. Drags to reorder (Morning Prayers = #1, Scripture = #2)
6. Saves configuration
7. All campaigns now use these libraries in this order

### Flow 5: View Content in Campaign

1. User views campaign content page
2. Sees content from configured libraries
3. Content is read-only
4. Can see which library each content comes from
5. Admin can click "View in Library" to edit in library editor

---

## UI/UX Requirements

### Calendar View Design

**Requirements**:
- Must handle 365+ days efficiently
- Quick navigation to specific day number
- Clear visual distinction between content states
- Responsive design for mobile/tablet
- Performant with large datasets

**Possible Implementations**:
- Month-style calendar with pagination
- Scrollable grid of day tiles
- List view with infinite scroll
- Combination of calendar + list views

### Language Filter Design

**Requirements**:
- Always visible at top of page
- Clear indication when filter is active
- Easy to reset to "All Languages"
- Smooth transition when changing filter

### Day Editor Design

**Requirements**:
- Clear indication of current day number
- Easy navigation to previous/next day
- Language tabs or sections for multi-language content
- Rich text editor for content
- Save/cancel actions always visible
- Unsaved changes warning

---

## Technical Considerations

### Performance

- Calendar view must load quickly even with 365+ days
- Lazy loading for content (only load day content when opened)
- Pagination for library list if many libraries exist
- Efficient queries for "days with content in language X"

### Data Migration

**Breaking Change**: No migration of existing campaign content
- Start fresh with new library system
- Old campaign content remains in database but is not accessible via UI
- Admin will create new libraries from scratch
- No backwards compatibility required

### Permissions

- Admin-only access to library creation/editing
- Read-only access to campaign content pages
- Configurable permissions for library management

### Validation

- Prevent duplicate day numbers in same library
- Require library name uniqueness
- Validate library order in global config
- Handle missing/deleted libraries gracefully

---

## Success Criteria

1.  Admin can create and manage centralized content libraries
2.  Admin can easily navigate and edit content for any day (1-365+)
3.  Admin can filter calendar view by language to find missing content
4.  Admin can configure which libraries are used by all campaigns
5.  Campaign content pages display library content (read-only)
6.  No more campaign-specific content creation
7.  System supports 2000+ campaigns without content duplication
8.  Clean break from old system - no backwards compatibility or migration needed

---

## Future Enhancements (Out of Scope for v1)

- Campaign-specific library overrides
- Library templates/cloning
- Bulk content import/export
- Content scheduling/versioning
- Analytics on library usage
- Content collaboration/workflow
- Multi-library content merging strategies
- Content preview before assigning to campaigns
