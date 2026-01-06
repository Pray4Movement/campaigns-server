# Prayer Tracking

## Overview

The prayer tracking system records when people pray and how long they spend praying. This data shows community engagement—how many people are praying and how much total prayer time is being accumulated across campaigns.

## How Prayer Time Is Captured

### The "I Prayed" Button

When someone visits the prayer content page and clicks "I Prayed," the system records how long they spent on the page, up to a maximum of 2 hours. This cap prevents over-counting if someone leaves the page open and returns much later. The button changes to show their prayer was recorded, along with a thank you message.

### Automatic Saving

Not everyone remembers to click the button. To capture prayer time even when people forget, the system automatically saves at three points while someone is on the prayer page:

- After 5 minutes
- After 10 minutes
- After 15 minutes

These automatic saves update quietly in the background. If the person clicks "I Prayed" at any point, automatic saving stops and their actual time is recorded.

This means even if someone prays for 12 minutes and closes the tab without clicking anything, the system will have captured 10 minutes of their prayer time from the automatic saves.

## Who Gets Credit

People who arrive at the prayer page through a link in their reminder email are identified automatically. Their prayer activity is connected to their subscriber record.

People who visit the prayer page directly (without coming through an email link) are tracked using their browser's local storage. The first time they visit, a unique anonymous ID is created and stored. When they return on subsequent days, they're recognized as the same person.

This means an anonymous user who prays every day for a week counts as 1 person, not 7. However, if they use a different browser or device, or clear their browser data, they'll be assigned a new ID.

## Campaign Statistics

Two numbers are calculated from prayer activity and shown on each campaign:

### People Praying

This shows the average number of unique people praying per day, averaged across days that had activity in the last 7 days. It counts people, not prayer sessions—if someone prays twice in one day, they're only counted once.

For example, if 5 people prayed on Monday and 5 on Tuesday (and no other days this week), this shows "5 praying"—the average across the 2 active days.

Anonymous visitors are tracked via browser storage, so the same anonymous person returning multiple days is counted as one person, not multiple.

### Daily Prayer Time

This shows the average daily prayer time over the last 7 days. It takes the total prayer time from the past week and divides by 7.

This is a true average—if no one prays for 3 days, those zeros are factored in. A campaign with 70 minutes of prayer this week shows "10m daily" regardless of whether that came from 7 days of 10-minute sessions or one day with 70 minutes.

Note that these two metrics are calculated differently. "People praying" averages across active days to avoid showing awkward fractions like "0.7 people." "Daily prayer time" always divides by 7 to show a true daily average.

The time is displayed in hours and minutes. For example, "2h 30m daily" means the campaign averages 150 minutes of prayer per day.

## Where Statistics Appear

**Admin Campaigns List** shows both "X praying" and the daily time for each campaign, letting you compare engagement across campaigns at a glance.

**Public Campaign Page** shows the "people praying" count with a progress bar toward a goal. Daily prayer time is not currently shown publicly.

## When Statistics Update

Statistics are recalculated once daily at 3 AM UTC. They also update when the server restarts. This means there can be a delay between when someone prays and when the campaign numbers reflect it.

Administrators can manually trigger an update if needed.

## Design Decisions

**7-day rolling window** - Statistics look at the past 7 days only. This shows recent engagement while smoothing out day-to-day variation. A campaign that was very active last month but quiet this week will show low numbers.

**True daily average for time** - Daily prayer time divides by 7 regardless of how many days had activity. This prevents the number from looking artificially high when activity is sparse.

**Capture without requiring action** - Automatic saving ensures prayer time is recorded even when people don't click the button. Many people read the content, pray, and close the tab without thinking to click anything.

**Three save points maximum** - Automatic saving stops after 15 minutes. Beyond that point, someone has likely left the page open rather than actively praying.

**Anonymous tracking via browser storage** - Anyone can access prayer content without coming through a tracked link. Their browser stores a unique ID so they're recognized when they return. This provides accurate counting without requiring accounts or logins.

## Current Limitations

- No way for individuals to see their own prayer history
- Statistics update daily rather than in real time
- No prayer streaks, badges, or other gamification
- Cannot distinguish between active prayer time and leaving the page open
- No breakdown of when during the day people pray
- Anonymous users on different browsers or devices are counted separately
- If someone clears their browser data, they'll be counted as a new person
