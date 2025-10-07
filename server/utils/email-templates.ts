export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export function getVerificationEmailTemplate(userName: string, verificationUrl: string): EmailTemplate {
  return {
    subject: 'Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; background: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #000000; color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 500;">Welcome!</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.8;">Please verify your email address</p>
        </div>
        
        <div style="background: #ffffff; border: 2px solid #000000; border-top: none; padding: 40px 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #000000; margin-top: 0; font-weight: 500;">Hello ${userName}!</h2>
          <p style="font-size: 16px; margin: 20px 0; color: #000000;">Thank you for registering! To complete your account setup, please verify your email address by clicking the button below.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="
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
            ">Verify Email Address</a>
          </div>
          
          <p style="color: #666666; font-size: 14px; margin-top: 30px;">
            If the button doesn't work, you can also copy and paste this link into your browser:
          </p>
          <p style="background: #f5f5f5; border: 1px solid #cccccc; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px; color: #333333;">
            ${verificationUrl}
          </p>
          
          <div style="border-top: 2px solid #000000; margin-top: 30px; padding-top: 20px; color: #666666; font-size: 12px;">
            <p>This verification link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${userName}!

Thank you for registering! To complete your account setup, please verify your email address.

Click or copy this link to verify your email:
${verificationUrl}

This verification link will expire in 24 hours for security reasons.

If you didn't create an account, you can safely ignore this email.
    `.trim()
  }
}

export function getWelcomeEmailTemplate(userName: string): EmailTemplate {
  return {
    subject: 'Welcome! Your account is now verified',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Welcome!</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your account is now verified</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
          <p style="font-size: 16px; margin: 20px 0;">Thank you for verifying your email address! Your account is now fully activated and ready to use.</p>
          
          <p style="font-size: 16px; margin: 20px 0;">You can now log in and start using all the features of your account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${useRuntimeConfig().public.siteUrl}/login" style="
              background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              font-size: 16px;
              display: inline-block;
              text-align: center;
            ">Login to Your Account</a>
          </div>
          
          <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; color: #666; font-size: 12px;">
            <p>If you have any questions or need help, feel free to contact our support team.</p>
            <p>Welcome aboard!</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${userName}!

Thank you for verifying your email address! Your account is now fully activated and ready to use.

You can now log in and start using all the features of your account.

Login at: ${useRuntimeConfig().public.siteUrl}/login

If you have any questions or need help, feel free to contact our support team.

Welcome aboard!
    `.trim()
  }
}