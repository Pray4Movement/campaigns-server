export interface FollowupEmailData {
  to: string
  subscriberName: string
  campaignTitle: string
  campaignSlug: string
  subscriptionId: number
  profileId: string
  frequency: 'daily' | 'weekly' | string
  daysOfWeek?: number[]
  isReminder?: boolean
}

function getDayNames(daysOfWeek: number[]): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return daysOfWeek.map(d => dayNames[d]).join(', ')
}

function getQuestionText(frequency: string, daysOfWeek?: number[]): {
  question: string
  committedText: string
  sometimesText: string
  notPrayingText: string
} {
  if (frequency === 'daily') {
    return {
      question: 'Are you still praying daily?',
      committedText: 'Yes, I pray daily',
      sometimesText: 'Sometimes, but not every day',
      notPrayingText: 'No, no longer praying'
    }
  } else {
    const days = daysOfWeek && daysOfWeek.length > 0 ? getDayNames(daysOfWeek) : 'your scheduled days'
    return {
      question: `Are you still praying on ${days}?`,
      committedText: 'Yes, on my scheduled days',
      sometimesText: 'Sometimes, but not always',
      notPrayingText: 'No, no longer praying'
    }
  }
}

export async function sendFollowupEmail(data: FollowupEmailData): Promise<boolean> {
  const config = useRuntimeConfig()
  const baseUrl = config.public.siteUrl || 'http://localhost:3000'
  const appName = config.appName || 'Prayer Tools'

  const profileUrl = `${baseUrl}/subscriber?id=${data.profileId}`

  // Build response URLs
  const buildResponseUrl = (response: string) =>
    `${baseUrl}/followup?sid=${data.subscriptionId}&response=${response}`

  const committedUrl = buildResponseUrl('committed')
  const sometimesUrl = buildResponseUrl('sometimes')
  const notPrayingUrl = buildResponseUrl('not_praying')

  // Get frequency-aware question text
  const questionText = getQuestionText(data.frequency, data.daysOfWeek)

  const subjectPrefix = data.isReminder ? 'Reminder: ' : ''
  const subject = `${subjectPrefix}${data.campaignTitle}: How is your prayer commitment going?`

  const introText = data.isReminder
    ? 'We sent you a message last week and wanted to follow up.'
    : 'We\'d love to hear how your prayer journey is going!'

  const buttonStyle = `
    display: block;
    width: 280px;
    padding: 14px 24px;
    margin: 10px auto;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    font-size: 14px;
    text-align: center;
    box-sizing: border-box;
  `

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prayer Check-In - ${data.campaignTitle}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #3B463D; background: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #3B463D; color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 500;">Prayer Check-In</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.8;">${data.campaignTitle}</p>
      </div>

      <div style="background: #ffffff; border: 2px solid #3B463D; border-top: none; padding: 40px 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #3B463D; margin-top: 0; font-weight: 500;">Hello ${data.subscriberName}!</h2>

        <p style="font-size: 16px; margin: 20px 0; color: #3B463D;">
          ${introText}
        </p>

        <p style="font-size: 18px; margin: 30px 0 20px; color: #3B463D; font-weight: 500; text-align: center;">
          ${questionText.question}
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${committedUrl}" style="${buttonStyle} background: #3B463D; color: #ffffff; border: 2px solid #3B463D;">
            ${questionText.committedText}
          </a>
          <a href="${sometimesUrl}" style="${buttonStyle} background: #ffffff; color: #3B463D; border: 2px solid #3B463D;">
            ${questionText.sometimesText}
          </a>
          <a href="${notPrayingUrl}" style="${buttonStyle} background: #f5f5f5; color: #666666; border: 2px solid #cccccc;">
            ${questionText.notPrayingText}
          </a>
        </div>

        <p style="font-size: 14px; color: #666666; margin-top: 30px; text-align: center;">
          Your feedback helps us understand how we can better support your prayer journey.
        </p>

        <p style="font-size: 13px; color: #999999; margin-top: 20px; text-align: center; font-style: italic;">
          If we don't hear from you, we'll pause your prayer reminders to avoid filling your inbox.
          You can always reactivate them from your profile.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666666; font-size: 12px;">
        <p style="margin: 0 0 10px;">This is a commitment check-in from ${appName}.</p>
        <p style="margin: 0;">
          <a href="${profileUrl}" style="color: #666666; text-decoration: underline;">Manage Preferences</a>
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
Prayer Check-In - ${data.campaignTitle}

Hello ${data.subscriberName}!

${introText}

${questionText.question}

- ${questionText.committedText}: ${committedUrl}
- ${questionText.sometimesText}: ${sometimesUrl}
- ${questionText.notPrayingText}: ${notPrayingUrl}

Your feedback helps us understand how we can better support your prayer journey.

If we don't hear from you, we'll pause your prayer reminders to avoid filling your inbox. You can always reactivate them from your profile.

---
This is a commitment check-in from ${appName}.
Manage Preferences: ${profileUrl}
  `.trim()

  return await sendEmail({
    to: data.to,
    subject,
    html,
    text
  })
}
