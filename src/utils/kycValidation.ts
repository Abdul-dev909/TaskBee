import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export async function requireKycVerification(providerId: string): Promise<boolean> {
  const { data } = await supabase
    .from("provider_kyc")
    .select("status")
    .eq("provider_id", providerId)
    .single();

  const status = data?.status || "unverified";

  if (status !== "verified") {
    toast({
      title: "Verification Required",
      description: "You need to verify your identity before performing this action.",
      variant: "destructive",
    });
    return false;
  }

  return true;
}
