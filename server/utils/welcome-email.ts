import { t, localePath } from './translations'

export async function sendWelcomeEmail(
  to: string,
  subscriberName: string,
  peopleGroupName: string,
  peopleGroupSlug: string,
  profileId: string,
  locale: string = 'en',
  trackingId?: string
): Promise<boolean> {
  const config = useRuntimeConfig()
  const baseUrl = config.public.siteUrl || 'http://localhost:3000'
  const appName = config.appName || 'Doxa'
  const prayerPath = localePath(`/${peopleGroupSlug}/prayer`, locale)
  const peopleGroupUrl = trackingId ? `${baseUrl}${prayerPath}?uid=${trackingId}` : `${baseUrl}${prayerPath}`
  const profileUrl = `${baseUrl}${localePath('/subscriber', locale)}?id=${profileId}`

  const subject = t('email.welcome.subject', locale, { appName, campaign: peopleGroupName })
  const header = t('email.welcome.header', locale, { appName })
  const hello = t('email.common.hello', locale, { name: subscriberName })
  const thankYou = t('email.welcome.thankYou', locale, { campaign: peopleGroupName })
  const startPraying = t('email.welcome.startPraying', locale)
  const profileInstructions = t('email.welcome.profileInstructions', locale)
  const managePreferences = t('email.common.managePreferences', locale)
  const automatedMessage = t('email.common.automatedMessage', locale, { appName })

  const html = `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #3B463D; background: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #3B463D; color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 500;">${header}</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.8;">${peopleGroupName}</p>
      </div>

      <div style="background: #ffffff; border: 2px solid #3B463D; border-top: none; padding: 40px 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #3B463D; margin-top: 0; font-weight: 500;">${hello}</h2>
        <p style="font-size: 16px; margin: 20px 0; color: #3B463D;">
          ${thankYou}
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${peopleGroupUrl}" style="
            background: #3B463D;
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            font-size: 16px;
            display: inline-block;
            text-align: center;
            border: 2px solid #3B463D;
          ">${startPraying}</a>
        </div>

        <p style="color: #666666; font-size: 14px; margin-top: 30px;">
          ${profileInstructions}
        </p>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${profileUrl}" style="
            background: #ffffff;
            color: #3B463D;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            font-size: 14px;
            display: inline-block;
            text-align: center;
            border: 2px solid #3B463D;
          ">${managePreferences}</a>
        </div>

      </div>

      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666666; font-size: 12px;">
        <p style="margin: 0;">${automatedMessage}</p>
      </div>
    </body>
    </html>
  `

  const text = `
${header} - ${peopleGroupName}

${hello}

${thankYou}

${startPraying}: ${peopleGroupUrl}

${managePreferences}: ${profileUrl}

${automatedMessage}
  `.trim()

  return await sendEmail({
    to,
    subject,
    html,
    text
  })
}
