import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface KycStatusProps {
  providerId: string;
}

export function KycStatusBadge({ providerId }: KycStatusProps) {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKycStatus();
  }, [providerId]);

  const fetchKycStatus = async () => {
    const { data } = await supabase
      .from("provider_kyc")
      .select("*")
      .eq("provider_id", providerId)
      .single();

    setKycStatus(data);
    setLoading(false);
  };

  if (loading) return null;

  const status = kycStatus?.status || "unverified";

  const statusConfig: Record<string, {
    badge: JSX.Element;
    showWarning: boolean;
    warningTitle?: string;
    warningMessage?: string;
    showButton?: boolean;
  }> = {
    verified: {
      badge: <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>,
      showWarning: false,
    },
    pending: {
      badge: <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending Verification</Badge>,
      showWarning: true,
      warningTitle: "Verification Under Review",
      warningMessage: "Your verification is being reviewed. You cannot accept jobs until approved.",
    },
    rejected: {
      badge: <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>,
      showWarning: true,
      warningTitle: "Verification Rejected",
      warningMessage: kycStatus?.rejection_reason || "Your verification was rejected. Please resubmit your documents.",
      showButton: true,
    },
    unverified: {
      badge: <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Not Verified</Badge>,
      showWarning: true,
      warningTitle: "Identity Verification Required",
      warningMessage: "You must verify your identity before accepting jobs and receiving payments.",
      showButton: true,
    },
  };

  const config = statusConfig[status] || statusConfig.unverified;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-medium">KYC Status:</span>
        {config.badge}
      </div>

      {config.showWarning && (
        <Card className="glass-card border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  {config.warningTitle}
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {config.warningMessage}
                </p>
                {config.showButton && (
                  <Button
                    onClick={() => navigate("/provider/verify")}
                    className="mt-3"
                    size="sm"
                  >
                    {status === "rejected" ? "Resubmit Documents" : "Verify Now"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export async function checkKycVerification(providerId: string): Promise<boolean> {
  const { data } = await supabase
    .from("provider_kyc")
    .select("status")
    .eq("provider_id", providerId)
    .single();

  return data?.status === "verified";
}
