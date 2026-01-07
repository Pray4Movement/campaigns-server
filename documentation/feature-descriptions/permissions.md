# Permissions System

## Overview

The permissions system controls what logged-in users can see and do. Users are assigned a role that determines their level of access.

## Roles

**Admin** has full access to everything. They can manage all campaigns, all content, invite users, and assign roles. They see the complete admin interface including Libraries, Campaign Config, and Users sections.

**Campaign Editor** can create and manage content, but only within campaigns they've been granted access to. They can also view and manage subscribers who are subscribed to their campaigns. They cannot see other campaigns, manage users, or access system settings.

**No Role** is the default for new users. They can log in but have no admin capabilities until an admin assigns them a role.

**Superadmin** is a separate designation for technical administrators who need access to system-level operations like manual backups.

## Granting Access

When you add someone as a Campaign Editor, they won't see any campaigns until you explicitly grant them access. This lets you control exactly what each person can work on.

Admins see all campaigns automatically and don't need individual campaign assignments.

To set up a new team member:

1. Invite them from the Users page (you can assign their role during invitation)
2. Once they register, assign their role if you didn't during invitation
3. For Campaign Editors, click their campaign access button and select which campaigns they should see

## Choosing the Right Role

Give someone **Admin** if they need to:
- See and manage all campaigns
- Invite and manage other users
- Access Libraries or Campaign Config

Give someone **Campaign Editor** if they:
- Only need to work on specific campaigns
- Shouldn't see other teams' campaigns
- Don't need to manage users or system settings

## Subscriber Access

Campaign Editors can see and manage subscribers who have subscriptions to their assigned campaigns:

- **View**: See subscriber details, contact info, and subscription settings
- **Edit**: Update subscriber names and subscription settings (frequency, time, timezone)
- **Delete**: Remove subscriptions from their campaigns
- **Activity**: View subscriber activity logs and email history
- **Send Reminders**: Manually send prayer reminder emails

If a subscriber has subscriptions to multiple campaigns, a Campaign Editor will only see the subscriptions for campaigns they have access to.

Campaign Editors with no campaign assignments will see an empty subscriber list.

## Current Limitations

- Users can only have one role
- Campaign access is all-or-nothing (no read-only option)
- No log of who changed permissions when
