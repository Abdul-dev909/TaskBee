import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header to verify the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's auth token
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the calling user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Failed to get user:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Caller user ID:', user.id);

    // Verify caller is an admin using the service role
    const { data: callerRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || callerRole?.role !== 'admin') {
      console.error('Caller is not an admin:', roleError?.message || 'Role is not admin');
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only admins can change user roles' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { targetUserId, newRole } = await req.json();

    // Validate inputs
    if (!targetUserId || !newRole) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: targetUserId and newRole' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validRoles = ['homeowner', 'service_provider', 'admin'];
    if (!validRoles.includes(newRole)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get existing role for audit
    const { data: existingRoleData, error: existingRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .single();

    if (existingRoleError) {
      console.error('Failed to get existing role:', existingRoleError.message);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingRole = existingRoleData?.role;

    // Prevent self-demotion from admin
    if (targetUserId === user.id && newRole !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Cannot demote yourself from admin role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the role change as a notification (audit trail)
    await supabaseAdmin.from('notifications').insert({
      user_id: user.id,
      title: 'Admin Action: Role Changed',
      body: `Admin ${user.email} changed user ${targetUserId} role from ${existingRole} to ${newRole}`,
      type: 'admin_audit'
    });

    console.log(`Role change audit: ${user.id} changed ${targetUserId} from ${existingRole} to ${newRole}`);

    // Update the role using service role (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', targetUserId);

    if (updateError) {
      console.error('Failed to update role:', updateError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to update user role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Role updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User role changed from ${existingRole} to ${newRole}` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in change-user-role function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
