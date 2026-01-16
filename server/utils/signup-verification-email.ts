export async function sendSignupVerificationEmail(
  to: string,
  verificationToken: string,
  campaignSlug: string,
  campaignTitle: string,
  subscriberName: string
): Promise<boolean> {
  const config = useRuntimeConfig()
  const baseUrl = config.public.siteUrl || 'http://localhost:3000'
  const appName = config.appName || 'Prayer Tools'
  const verificationUrl = `${baseUrl}/${campaignSlug}/verify?token=${verificationToken}`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your email for ${campaignTitle}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #3B463D; background: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #3B463D; color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 500;">Verify Your Email</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.8;">${campaignTitle}</p>
      </div>

      <div style="background: #ffffff; border: 2px solid #3B463D; border-top: none; padding: 40px 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #3B463D; margin-top: 0; font-weight: 500;">Hello ${subscriberName}!</h2>
        <p style="font-size: 16px; margin: 20px 0; color: #3B463D;">
          Thank you for signing up for prayer reminders for <strong>${campaignTitle}</strong>.
        </p>

        <p style="font-size: 16px; margin: 20px 0; color: #3B463D;">
          Please verify your email address by clicking the button below:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="
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
          ">Verify Email</a>
        </div>

        <p style="color: #666666; font-size: 14px; margin-top: 30px;">
          If the button doesn't work, you can also copy and paste this link into your browser:
        </p>
        <p style="background: #f5f5f5; border: 1px solid #cccccc; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px; color: #333333;">
          ${verificationUrl}
        </p>

        <p style="color: #666666; font-size: 14px; margin-top: 30px;">
          <strong>Note:</strong> This verification link will expire in 7 days.
        </p>

        <p style="color: #666666; font-size: 14px; margin-top: 20px;">
          If you didn't sign up for prayer reminders, you can safely ignore this email.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666666; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from ${appName}. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `

  const text = `
Verify Your Email for ${campaignTitle}

Hello ${subscriberName}!

Thank you for signing up for prayer reminders for ${campaignTitle}.

Please verify your email address by visiting this link:
${verificationUrl}

Note: This verification link will expire in 7 days.

If you didn't sign up for prayer reminders, you can safely ignore this email.

This is an automated message from ${appName}. Please do not reply to this email.
  `.trim()

  return await sendEmail({
    to,
    subject: `Verify your email for ${campaignTitle}`,
    html,
    text
  })
}
