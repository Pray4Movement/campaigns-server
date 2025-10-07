import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { EmailTemplate } from './email-templates'

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!transporter) {
    const config = useRuntimeConfig()
    
    // Development: Use MailHog for local email testing
    // Production: Use configured SMTP server
    const isDev = process.env.NODE_ENV !== 'production'
    
    if (isDev) {
      // MailHog configuration for development
      transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false,
        ignoreTLS: true,
        tls: {
          rejectUnauthorized: false
        }
        // No auth needed for MailHog
      })
      console.log('📧 Email: Using MailHog for development (http://localhost:8025)')
    } else {
      // Production SMTP configuration
      transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure, // true for 465, false for other ports
        auth: config.smtpUser && config.smtpPass ? {
          user: config.smtpUser,
          pass: config.smtpPass,
        } : undefined,
        tls: {
          rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
        }
      })
      console.log(`📧 Email: Using SMTP server ${config.smtpHost}:${config.smtpPort}`)
    }
  }
  
  return transporter!
}

export interface EmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
  template?: EmailTemplate
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const config = useRuntimeConfig()
    const transporter = getTransporter()
    
    // Use template if provided, otherwise use direct html/text
    const emailContent = options.template || {
      subject: options.subject,
      html: options.html || '',
      text: options.text || ''
    }
    
    const mailOptions = {
      from: config.smtpFrom,
      to: options.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }
    
    const info = await transporter.sendMail(mailOptions)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email sent:', info.messageId)
      console.log('📧 Preview URL: http://localhost:8025')
    } else {
      console.log('📧 Email sent successfully to:', options.to)
    }
    
    return true
  } catch (error) {
    console.error('📧 Email sending failed:', error)
    return false
  }
}

export async function sendVerificationEmail(to: string, userName: string, verificationUrl: string): Promise<boolean> {
  const { getVerificationEmailTemplate } = await import('./email-templates')
  const template = getVerificationEmailTemplate(userName, verificationUrl)
  
  return sendEmail({
    to,
    subject: template.subject,
    template
  })
}

export async function sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
  const { getWelcomeEmailTemplate } = await import('./email-templates')
  const template = getWelcomeEmailTemplate(userName)
  
  return sendEmail({
    to,
    subject: template.subject,
    template
  })
}

// Test email functionality
export async function sendTestEmail(to: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Test Email - Email System Working',
    html: `
      <h2>Email System Test</h2>
      <p>This is a test email to verify that your email configuration is working correctly.</p>
      <p>If you received this email, your email system is properly configured!</p>
      <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    `,
    text: `
Email System Test

This is a test email to verify that your email configuration is working correctly.

If you received this email, your email system is properly configured!

Environment: ${process.env.NODE_ENV || 'development'}
Timestamp: ${new Date().toISOString()}
    `.trim()
  })
}