import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { format } from "date-fns";

interface KycRecord {
  id: string;
  provider_id: string;
  full_name: string;
  cnic_number: string;
  cnic_front_url: string;
  cnic_back_url: string;
  selfie_url: string;
  phone: string;
  address: string | null;
  status: string;
  rejection_reason: string | null;
  submitted_at: string;
  verified_at: string | null;
}

export default function AdminKycVerification() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [kycRecords, setKycRecords] = useState<KycRecord[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<KycRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    fetchKycRecords();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roles?.role !== "admin") {
      navigate("/");
    }
  };

  const fetchKycRecords = async () => {
    const { data, error } = await supabase
      .from("provider_kyc")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch KYC records",
        variant: "destructive",
      });
      return;
    }

    setKycRecords(data || []);
  };

  const handleApprove = async (kyc: KycRecord) => {
    setLoading(true);
    try {
      await supabase
        .from("provider_kyc")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", kyc.id);

      await supabase
        .from("provider_profiles")
        .update({ is_verified: true })
        .eq("user_id", kyc.provider_id);

      await supabase
        .from("notifications")
        .insert({
          user_id: kyc.provider_id,
          title: "KYC Approved",
          body: "Your account has been successfully verified! You can now accept jobs and receive payments.",
          type: "kyc_approved",
        });

      toast({
        title: "KYC Approved",
        description: `${kyc.full_name}'s verification has been approved`,
      });

      setShowModal(false);
      fetchKycRecords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (kyc: KycRecord) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await supabase
        .from("provider_kyc")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          verified_at: null,
        })
        .eq("id", kyc.id);

      await supabase
        .from("provider_profiles")
        .update({ is_verified: false })
        .eq("user_id", kyc.provider_id);

      await supabase
        .from("notifications")
        .insert({
          user_id: kyc.provider_id,
          title: "KYC Rejected",
          body: `Your verification was rejected. Reason: ${rejectionReason}`,
          type: "kyc_rejected",
        });

      toast({
        title: "KYC Rejected",
        description: `${kyc.full_name}'s verification has been rejected`,
      });

      setShowModal(false);
      setRejectionReason("");
      fetchKycRecords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unverified</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              KYC Verification
            </h1>
            <p className="text-muted-foreground mt-2">
              Review and manage provider identity verification requests
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kycRecords.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {kycRecords.filter(k => k.status === "pending").length}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {kycRecords.filter(k => k.status === "verified").length}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {kycRecords.filter(k => k.status === "rejected").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>KYC Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Provider Name</th>
                    <th className="text-left p-3">CNIC Number</th>
                    <th className="text-left p-3">Phone</th>
                    <th className="text-left p-3">Submission Date</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycRecords.map((kyc) => (
                    <tr key={kyc.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{kyc.full_name}</td>
                      <td className="p-3">{kyc.cnic_number}</td>
                      <td className="p-3">{kyc.phone}</td>
                      <td className="p-3">{format(new Date(kyc.submitted_at), "PPP")}</td>
                      <td className="p-3">{getStatusBadge(kyc.status)}</td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedKyc(kyc);
                            setShowModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {kycRecords.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No KYC submissions yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">KYC Verification Details</DialogTitle>
            <DialogDescription>
              Review the provider's submitted documents and information
            </DialogDescription>
          </DialogHeader>

          {selectedKyc && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{selectedKyc.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">CNIC Number</Label>
                  <p className="font-medium">{selectedKyc.cnic_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedKyc.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{selectedKyc.address || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedKyc.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted At</Label>
                  <p className="font-medium">{format(new Date(selectedKyc.submitted_at), "PPP p")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold">Uploaded Documents</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">CNIC Front</Label>
                    <img
                      src={selectedKyc.cnic_front_url}
                      alt="CNIC Front"
                      className="w-full h-48 object-cover rounded-lg border mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">CNIC Back</Label>
                    <img
                      src={selectedKyc.cnic_back_url}
                      alt="CNIC Back"
                      className="w-full h-48 object-cover rounded-lg border mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Selfie with CNIC</Label>
                    <img
                      src={selectedKyc.selfie_url}
                      alt="Selfie"
                      className="w-full h-48 object-cover rounded-lg border mt-2"
                    />
                  </div>
                </div>
              </div>

              {selectedKyc.status === "pending" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rejection_reason">Rejection Reason (if rejecting)</Label>
                    <Textarea
                      id="rejection_reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(selectedKyc)}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Verification
                    </Button>
                    <Button
                      onClick={() => handleReject(selectedKyc)}
                      disabled={loading}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Verification
                    </Button>
                  </div>
                </div>
              )}

              {selectedKyc.status === "rejected" && selectedKyc.rejection_reason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <Label className="text-destructive font-semibold">Rejection Reason:</Label>
                  <p className="text-sm mt-2">{selectedKyc.rejection_reason}</p>
                </div>
              )}

              {selectedKyc.status === "verified" && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    This provider has been verified
                  </p>
                  {selectedKyc.verified_at && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Verified on {format(new Date(selectedKyc.verified_at), "PPP")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
