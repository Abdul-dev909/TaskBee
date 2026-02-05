import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get database size using pg_database_size
    const { data: dbSizeData, error: dbSizeError } = await supabase.rpc('get_database_size');
    
    if (dbSizeError) {
      console.error("Database size error:", dbSizeError);
      // Fallback: estimate from table counts
      const tables = ['jobs', 'messages', 'profiles', 'provider_profiles', 'job_requests', 
                      'payments', 'notifications', 'complaints', 'provider_kyc', 
                      'archived_jobs', 'archived_messages'];
      
      let totalRows = 0;
      for (const table of tables) {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        totalRows += count || 0;
      }
      
      // Rough estimate: ~1KB per row average
      const estimatedBytes = totalRows * 1024;
      const maxBytes = 500 * 1024 * 1024; // 500MB free tier limit
      
      return new Response(
        JSON.stringify({
          used_bytes: estimatedBytes,
          max_bytes: maxBytes,
          used_mb: Math.round(estimatedBytes / (1024 * 1024) * 100) / 100,
          max_mb: 500,
          percentage: Math.round((estimatedBytes / maxBytes) * 100 * 100) / 100,
          is_estimate: true,
          total_rows: totalRows,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const usedBytes = dbSizeData || 0;
    const maxBytes = 500 * 1024 * 1024; // 500MB free tier limit

    return new Response(
      JSON.stringify({
        used_bytes: usedBytes,
        max_bytes: maxBytes,
        used_mb: Math.round(usedBytes / (1024 * 1024) * 100) / 100,
        max_mb: 500,
        percentage: Math.round((usedBytes / maxBytes) * 100 * 100) / 100,
        is_estimate: false,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
