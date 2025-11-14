import { supabase } from "@/integrations/supabase/client";

interface RateLimitConfig {
  action: 'job_application' | 'message_send' | 'complaint_submission';
  limit: number;
  windowMinutes: number;
}

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  job_application: { action: 'job_application', limit: 10, windowMinutes: 60 },
  message_send: { action: 'message_send', limit: 5, windowMinutes: 1 },
  complaint_submission: { action: 'complaint_submission', limit: 5, windowMinutes: 1440 }, // 24 hours
};

export const checkRateLimit = async (actionType: 'job_application' | 'message_send' | 'complaint_submission'): Promise<{ allowed: boolean; message?: string }> => {
  const config = RATE_LIMIT_CONFIGS[actionType];
  if (!config) {
    return { allowed: true };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { allowed: false, message: "You must be logged in" };
  }

  // Calculate window start time
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

  // Check for existing rate limit record within the window
  const { data: existingLimit, error: fetchError } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', user.id)
    .eq('action_type', actionType)
    .gte('window_start', windowStart.toISOString())
    .order('window_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('Error checking rate limit:', fetchError);
    return { allowed: true }; // Fail open to not break functionality
  }

  if (existingLimit) {
    // Check if limit exceeded
    if (existingLimit.action_count >= config.limit) {
      const timeRemaining = Math.ceil((new Date(existingLimit.window_start).getTime() + config.windowMinutes * 60000 - Date.now()) / 60000);
      return {
        allowed: false,
        message: `Rate limit exceeded. Please wait ${timeRemaining} minute(s) before trying again.`
      };
    }

    // Increment counter
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ action_count: existingLimit.action_count + 1 })
      .eq('id', existingLimit.id);

    if (updateError) {
      console.error('Error updating rate limit:', updateError);
    }
  } else {
    // Create new rate limit record
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        user_id: user.id,
        action_type: actionType,
        action_count: 1,
        window_start: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error creating rate limit:', insertError);
    }
  }

  return { allowed: true };
};

export const getRateLimitInfo = (actionType: 'job_application' | 'message_send' | 'complaint_submission') => {
  const config = RATE_LIMIT_CONFIGS[actionType];
  if (!config) return null;

  const windowText = config.windowMinutes >= 60 
    ? `${config.windowMinutes / 60} hour${config.windowMinutes / 60 > 1 ? 's' : ''}`
    : `${config.windowMinutes} minute${config.windowMinutes > 1 ? 's' : ''}`;

  return {
    limit: config.limit,
    window: windowText,
  };
};
