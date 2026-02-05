import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting payment reminders check...')

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all completed jobs
    const { data: completedJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, posted_by, updated_at, assigned_provider_id')
      .eq('status', 'completed')

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      throw jobsError
    }

    console.log(`Found ${completedJobs?.length || 0} completed jobs`)

    if (!completedJobs || completedJobs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No completed jobs found' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let remindersCreated = 0
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Check each completed job
    for (const job of completedJobs) {
      // Check if job was completed more than 24 hours ago
      const jobUpdatedAt = new Date(job.updated_at)
      if (jobUpdatedAt > twentyFourHoursAgo) {
        console.log(`Job ${job.id} was completed less than 24 hours ago, skipping`)
        continue
      }

      // Check if payment exists for this job
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('id')
        .eq('job_id', job.id)
        .maybeSingle()

      if (paymentError) {
        console.error(`Error checking payment for job ${job.id}:`, paymentError)
        continue
      }

      // If no payment exists, check if we already sent a reminder today
      if (!payment) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        
        const { data: existingReminder } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', job.posted_by)
          .eq('type', 'payment_reminder')
          .eq('related_id', job.id)
          .gte('created_at', oneDayAgo.toISOString())
          .maybeSingle()

        // Only send reminder if we haven't sent one in the last 24 hours
        if (!existingReminder) {
          console.log(`Creating payment reminder for job ${job.id}`)

          // Get provider name for the notification
          const { data: providerProfile } = await supabase
            .from('provider_profiles')
            .select('full_name')
            .eq('user_id', job.assigned_provider_id)
            .maybeSingle()

          const providerName = providerProfile?.full_name || 'the service provider'

          // Create notification
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: job.posted_by,
              title: 'Payment Reminder ⏰',
              body: `Your job "${job.title}" was completed by ${providerName}. Please complete the payment to release funds to the provider.`,
              type: 'payment_reminder',
              related_id: job.id
            })

          if (notificationError) {
            console.error(`Error creating notification for job ${job.id}:`, notificationError)
          } else {
            remindersCreated++
            console.log(`Payment reminder created for job ${job.id}`)
          }
        } else {
          console.log(`Reminder already sent for job ${job.id} in the last 24 hours`)
        }
      } else {
        console.log(`Payment already exists for job ${job.id}`)
      }
    }

    console.log(`Payment reminders check completed. Created ${remindersCreated} reminders.`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Payment reminders check completed. Created ${remindersCreated} reminders.`,
        jobsChecked: completedJobs.length,
        remindersCreated
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error: any) {
    console.error('Error in payment reminders function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
