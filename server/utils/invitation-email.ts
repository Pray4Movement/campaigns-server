export async function sendInvitationEmail(
  to: string,
  invitationToken: string,
  invitedBy: string,
  expiresAt: string
): Promise<boolean> {
  const config = useRuntimeConfig()
  const baseUrl = config.public.siteUrl || 'http://localhost:3000'
  const invitationUrl = `${baseUrl}/accept-invitation?token=${invitationToken}`
  const expiresDate = new Date(expiresAt).toLocaleDateString()

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You've been invited to Prayer Tools</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; background: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #000000; color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 500;">You've been invited!</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.8;">Join Prayer Tools as an administrator</p>
      </div>

      <div style="background: #ffffff; border: 2px solid #000000; border-top: none; padding: 40px 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #000000; margin-top: 0; font-weight: 500;">Hello!</h2>
        <p style="font-size: 16px; margin: 20px 0; color: #000000;">
          <strong>${invitedBy}</strong> has invited you to join <strong>Prayer Tools</strong> as an administrator.
        </p>

        <p style="font-size: 16px; margin: 20px 0; color: #000000;">
          Click the button below to accept your invitation and set up your account:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" style="
            background: #000000;
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            font-size: 16px;
            display: inline-block;
            text-align: center;
            border: 2px solid #000000;
          ">Accept Invitation</a>
        </div>

        <p style="color: #666666; font-size: 14px; margin-top: 30px;">
          If the button doesn't work, you can also copy and paste this link into your browser:
        </p>
        <p style="background: #f5f5f5; border: 1px solid #cccccc; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px; color: #333333;">
          ${invitationUrl}
        </p>

        <p style="color: #666666; font-size: 14px; margin-top: 30px;">
          <strong>Note:</strong> This invitation will expire on ${expiresDate}. After that, you'll need to request a new invitation.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666666; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from Prayer Tools. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `

  const text = `
You've been invited to Prayer Tools!

${invitedBy} has invited you to join Prayer Tools as an administrator.

Accept your invitation by visiting this link:
${invitationUrl}

Note: This invitation will expire on ${expiresDate}. After that, you'll need to request a new invitation.

This is an automated message from Prayer Tools. Please do not reply to this email.
  `.trim()

  return await sendEmail({
    to,
    subject: "You've been invited to Prayer Tools Admin",
    html,
    text
  })
}
