# People Group Adoption

This system lets churches and organizations formally adopt people groups for prayer, tracks their ongoing engagement through periodic reports, and publicly celebrates these commitments on people group pages.

## What it does

When a church or organization wants to commit to praying for an unreached people group, an admin creates an "adoption" linking that group to the people group. The system then:

1. Tracks which organizations are praying for which people groups
2. Sends monthly email reminders asking for prayer updates
3. Collects reports on how many people are praying and what stories are emerging
4. Displays adoption commitments publicly on people group pages to inspire others

## Key concepts

### Groups

A group represents a church, organization, or prayer team. Each group has:

- A name (e.g., "First Baptist Church")
- A primary contact person (selected from existing subscribers)
- An optional country
- Any number of linked contacts (subscribers associated with the group)

Groups are the organizational unit that adopts people groups. One group can adopt multiple people groups, and one people group can be adopted by multiple groups.

### Adoptions

An adoption is the link between a group and a people group. Each adoption has:

- A **status**: pending, active, or inactive
- A **public visibility** setting controlling whether the group's name appears on the people group's public page
- A unique **update link** (magic link) used to submit reports without logging in

### Adoption reports

Reports are submitted by the adopting group to share how their prayer commitment is going. Each report can include:

- How many people are currently praying
- Stories or testimonies from prayer times
- Comments or questions for the admin team

Reports go through a review process: they start as "submitted" and an admin can approve or reject them.

## How groups adopt a people group

1. An admin creates a group in the admin panel, sets a primary contact, and optionally adds other contacts
2. The admin creates an adoption, selecting which people group the group will pray for
3. The adoption starts as active by default
4. If "show publicly" is enabled, the group's name appears on the people group's public page

## How update reports are collected

### Monthly automated reminders

On the 1st of each month, the system automatically emails the primary contact of every group that has at least one active adoption. The email lists all of the group's adopted people groups, each with its own "Submit Update" link.

### Manual reminders

Admins can also send a reminder email manually from the adoption detail panel at any time. This is useful for following up outside the monthly cycle.

### The update form

When someone clicks the update link (from either an automated or manual email), they see a simple form asking:

- How many people are praying?
- Any stories from prayer times?
- Any comments or questions?

The form does not require logging in — the unique link serves as authentication. After submitting, they see a confirmation with the group and people group names.

## What the public sees

On a people group's public page, visitors can see:

- How many churches/organizations have adopted the people group
- The names of adopting groups (only those marked as publicly visible and with an active adoption)

This helps visitors see that others are already committed and may encourage them to get involved.

## Admin management

### Groups page

The admin groups page shows all groups with their adoption and contact counts. Selecting a group reveals:

- **Group details** — Edit the name, primary contact, and country
- **Contacts** — Add or remove subscribers linked to the group
- **Adoptions** — View all adoptions with status badges, add new adoptions

### Adoption detail panel

Clicking an adoption opens a detail panel where admins can:

- Change the adoption status (pending, active, inactive)
- Toggle public visibility
- Copy the update link to share manually
- Send a reminder email to the primary contact
- View submitted reports and approve or reject them
- Delete the adoption or mark it inactive to preserve history

### Deleting a group

Deleting a group removes all of its adoptions and their associated reports. The system warns the admin before proceeding.

## Key decisions

**Why use groups instead of linking adoptions directly to subscribers?**
A church adoption is an organizational commitment, not an individual one. The primary contact may change over time, but the adoption belongs to the group. Multiple contacts can be associated with a group for administrative purposes.

**Why magic links instead of requiring login?**
The people submitting updates (church leaders, prayer coordinators) may not have accounts in the system. Magic links make it frictionless — click the link in the email, fill out the form, done.

**Why review reports before publishing?**
Reports may eventually be displayed publicly or shared with stakeholders. Having a review step ensures quality and appropriateness before anything is shared.

**Why "inactive" instead of just deleting adoptions?**
Making an adoption inactive preserves the history of reports and the relationship. This is useful for tracking long-term engagement even if a group pauses their commitment.

## Current limitations

- Only the primary contact receives reminder emails — other group contacts are not included
- There is no way to customize the reminder email content per group or per people group
- Adoption reports are collected but not yet displayed publicly anywhere
- No bulk operations for managing adoptions across multiple groups
- The monthly reminder schedule is fixed to the 1st of each month and cannot be configured
- No tracking of whether reminder emails are opened or update links are clicked
