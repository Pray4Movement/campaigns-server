import { campaignService } from '#server/database/campaigns'
import { reminderSignupService } from '#server/database/reminder-signups'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  // Get campaign by slug
  const campaign = await campaignService.getCampaignBySlug(slug)

  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  // Only allow signups for active campaigns
  if (campaign.status !== 'active') {
    throw createError({
      statusCode: 400,
      statusMessage: 'This campaign is not accepting signups'
    })
  }

  // Get request body
  const body = await readBody(event)

  // Validate required fields
  if (!body.name || !body.delivery_method || !body.frequency || !body.reminder_time) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: name, delivery_method, frequency, reminder_time'
    })
  }

  // Validate delivery method
  if (!['email', 'whatsapp', 'app'].includes(body.delivery_method)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid delivery method. Must be email, whatsapp, or app'
    })
  }

  // Validate email for email delivery
  if (body.delivery_method === 'email' && !body.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required for email delivery'
    })
  }

  // Validate phone for whatsapp delivery
  if (body.delivery_method === 'whatsapp' && !body.phone) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Phone number is required for WhatsApp delivery'
    })
  }

  // Validate weekly frequency has days selected
  if (body.frequency === 'weekly' && (!body.days_of_week || body.days_of_week.length === 0)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Days of week are required for weekly frequency'
    })
  }

  try {
    // Create the signup
    const signup = await reminderSignupService.createSignup({
      campaign_id: campaign.id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      delivery_method: body.delivery_method,
      frequency: body.frequency,
      days_of_week: body.days_of_week,
      time_preference: body.reminder_time
    })

    // Return success with tracking ID
    return {
      success: true,
      tracking_id: signup.tracking_id,
      message: 'Successfully signed up for prayer reminders'
    }
  } catch (error: any) {
    console.error('Signup error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create signup'
    })
  }
})
