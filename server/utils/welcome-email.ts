export async function sendWelcomeEmail(
  to: string,
  subscriberName: string,
  campaignTitle: string,
  campaignSlug: string,
  profileId: string
): Promise<boolean> {
  const config = useRuntimeConfig()
  const baseUrl = config.public.siteUrl || 'http://localhost:3000'
  const campaignUrl = `${baseUrl}/${campaignSlug}`
  const profileUrl = `${baseUrl}/subscriber?id=${profileId}`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Doxa</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #3B463D; background: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #3B463D; color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 500;">Welcome to Doxa</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.8;">${campaignTitle}</p>
      </div>

      <div style="background: #ffffff; border: 2px solid #3B463D; border-top: none; padding: 40px 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #3B463D; margin-top: 0; font-weight: 500;">Hello ${subscriberName}!</h2>
        <p style="font-size: 16px; margin: 20px 0; color: #3B463D;">
          Thank you for signing up to pray. Your email has been verified and you're all set to receive prayer reminders for <strong>${campaignTitle}</strong>.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${campaignUrl}" style="
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
          ">Start Praying</a>
        </div>

        <p style="color: #666666; font-size: 14px; margin-top: 30px;">
          You can update your profile details and your notifications here:
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
          ">Manage Preferences</a>
        </div>

      </div>

      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666666; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from Doxa. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `

  const text = `
Welcome to Doxa - ${campaignTitle}

Hello ${subscriberName}!

Thank you for signing up to pray. Your email has been verified and you're all set to receive prayer reminders for ${campaignTitle}.

Start Praying: ${campaignUrl}

Manage Preferences: ${profileUrl}

This is an automated message from Doxa. Please do not reply to this email.
  `.trim()

  return await sendEmail({
    to,
    subject: `Welcome to Doxa - ${campaignTitle}`,
    html,
    text
  })
}
