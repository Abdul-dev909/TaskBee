import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create admin client for trusted operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing payment for user:', user.id);

    const { jobId } = await req.json();
    if (!jobId) {
      console.error('No jobId provided');
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SERVER-SIDE: Verify job exists and user owns it
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, title, posted_by, assigned_provider_id, status')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobError);
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (job.posted_by !== user.id) {
      console.error('User does not own this job');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You do not own this job' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check job has an assigned provider
    if (!job.assigned_provider_id) {
      console.error('No provider assigned to this job');
      return new Response(
        JSON.stringify({ error: 'No provider assigned to this job' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SERVER-SIDE: Check for duplicate payment
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('job_id', jobId)
      .maybeSingle();

    if (existingPayment) {
      console.error('Payment already exists for this job');
      return new Response(
        JSON.stringify({ error: 'This job has already been paid for' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SERVER-SIDE: Get accepted offer rate from database (trusted source)
    const { data: acceptedOffer, error: offerError } = await supabaseAdmin
      .from('job_requests')
      .select('proposed_rate')
      .eq('job_id', jobId)
      .eq('status', 'accepted')
      .single();

    if (offerError || !acceptedOffer) {
      console.error('No accepted offer found:', offerError);
      return new Response(
        JSON.stringify({ error: 'No accepted offer found for this job' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SERVER-SIDE: Calculate amounts (trusted calculation)
    const offeredRate = Number(acceptedOffer.proposed_rate);
    const platformFee = 49; // Fixed platform fee
    const totalAmount = offeredRate + platformFee;
    const commission = Math.floor(offeredRate * 0.08); // 8% commission
    const netAmount = offeredRate - commission;

    console.log('Payment calculation:', { offeredRate, platformFee, totalAmount, commission, netAmount });

    // SERVER-SIDE: Create payment record (using service role)
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        job_id: jobId,
        homeowner_id: user.id,
        provider_id: job.assigned_provider_id,
        offered_rate: offeredRate,
        platform_fee: platformFee,
        total_amount: totalAmount,
        status: 'Paid'
      });

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      throw new Error('Failed to create payment record');
    }

    // SERVER-SIDE: Update job status to completed
    const { error: jobUpdateError } = await supabaseAdmin
      .from('jobs')
      .update({ status: 'completed' })
      .eq('id', jobId);

    if (jobUpdateError) {
      console.error('Failed to update job status:', jobUpdateError);
      throw new Error('Failed to update job status');
    }

    // SERVER-SIDE: Update provider wallet (using service role)
    const { data: existingWallet } = await supabaseAdmin
      .from('provider_wallet')
      .select('balance')
      .eq('provider_id', job.assigned_provider_id)
      .maybeSingle();

    if (existingWallet) {
      const { error: walletUpdateError } = await supabaseAdmin
        .from('provider_wallet')
        .update({
          balance: existingWallet.balance + netAmount,
          updated_at: new Date().toISOString()
        })
        .eq('provider_id', job.assigned_provider_id);

      if (walletUpdateError) {
        console.error('Failed to update wallet:', walletUpdateError);
        throw new Error('Failed to update provider wallet');
      }
    } else {
      const { error: walletInsertError } = await supabaseAdmin
        .from('provider_wallet')
        .insert({
          provider_id: job.assigned_provider_id,
          balance: netAmount,
          updated_at: new Date().toISOString()
        });

      if (walletInsertError) {
        console.error('Failed to create wallet:', walletInsertError);
        throw new Error('Failed to create provider wallet');
      }
    }

    // SERVER-SIDE: Create provider transaction record (using service role)
    const { error: transactionError } = await supabaseAdmin
      .from('provider_transactions')
      .insert({
        provider_id: job.assigned_provider_id,
        job_id: jobId,
        gross_amount: offeredRate,
        commission: commission,
        net_amount: netAmount
      });

    if (transactionError) {
      console.error('Failed to create transaction record:', transactionError);
      // Non-critical, don't fail the payment
    }

    // SERVER-SIDE: Create notifications (using service role)
    // Notification for homeowner
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Payment Successful ✅',
        body: `Your payment of Rs. ${totalAmount} for "${job.title}" has been processed successfully.`,
        type: 'payment',
        related_id: jobId
      });

    // Notification for provider
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: job.assigned_provider_id,
        title: 'Payment Received 💰',
        body: `You received Rs. ${netAmount} (after 8% commission) for completing "${job.title}". Amount added to your wallet.`,
        type: 'payment',
        related_id: jobId
      });

    console.log('Payment processed successfully for job:', jobId);

    return new Response(
      JSON.stringify({
        success: true,
        totalAmount: totalAmount,
        offeredRate: offeredRate,
        platformFee: platformFee,
        netAmount: netAmount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Payment processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
