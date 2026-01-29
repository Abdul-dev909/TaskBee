import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Upload, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ProviderVerify() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [existingKyc, setExistingKyc] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    cnic_number: "",
    phone: "",
    address: "",
  });
  const [files, setFiles] = useState({
    cnic_front: null as File | null,
    cnic_back: null as File | null,
    selfie: null as File | null,
  });

  useEffect(() => {
    checkAuth();
    fetchProviderData();
    checkExistingKyc();
  }, []);

  const checkAuth = async () => {
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

    if (roles?.role !== "service_provider") {
      navigate("/");
    }
  };

  const fetchProviderData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("provider_profiles")
      .select("full_name, phone")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      }));
    }
  };

  const checkExistingKyc = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("provider_kyc")
      .select("*")
      .eq("provider_id", user.id)
      .single();

    setExistingKyc(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from("kyc_documents")
      .upload(path, file);

    if (error) throw error;

    // Return just the path, not a public URL
    // The private bucket requires signed URLs for access
    // Admins will generate signed URLs when viewing documents
    return path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.cnic_number || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!files.cnic_front || !files.cnic_back || !files.selfie) {
      toast({
        title: "Error",
        description: "Please upload all required documents",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      const cnicFrontUrl = await uploadFile(
        files.cnic_front,
        `${user.id}/cnic_front_${timestamp}.${files.cnic_front.name.split('.').pop()}`
      );
      const cnicBackUrl = await uploadFile(
        files.cnic_back,
        `${user.id}/cnic_back_${timestamp}.${files.cnic_back.name.split('.').pop()}`
      );
      const selfieUrl = await uploadFile(
        files.selfie,
        `${user.id}/selfie_${timestamp}.${files.selfie.name.split('.').pop()}`
      );

      const kycData = {
        provider_id: user.id,
        full_name: formData.full_name,
        cnic_number: formData.cnic_number,
        cnic_front_url: cnicFrontUrl,
        cnic_back_url: cnicBackUrl,
        selfie_url: selfieUrl,
        phone: formData.phone,
        address: formData.address,
        status: "pending",
      };

      if (existingKyc) {
        await supabase
          .from("provider_kyc")
          .update(kycData)
          .eq("provider_id", user.id);
      } else {
        await supabase
          .from("provider_kyc")
          .insert(kycData);
      }

      toast({
        title: "Documents Submitted",
        description: "Your documents have been submitted. Verification typically takes 24–48 hours.",
      });

      setTimeout(() => navigate("/provider-dashboard"), 2000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/provider-dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card border-primary/20">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Shield className="h-12 w-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Identity Verification</CardTitle>
              <CardDescription className="text-lg">
                {existingKyc?.status === "rejected" 
                  ? "Your previous submission was rejected. Please resubmit your documents."
                  : "Complete your KYC verification to accept jobs and receive payments"}
              </CardDescription>
              {existingKyc?.status === "rejected" && existingKyc?.rejection_reason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
                  <strong>Rejection Reason:</strong> {existingKyc.rejection_reason}
                </div>
              )}
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Personal Information
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="full_name">Full Legal Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cnic_number">CNIC / National ID Number *</Label>
                      <Input
                        id="cnic_number"
                        value={formData.cnic_number}
                        onChange={(e) => setFormData({ ...formData, cnic_number: e.target.value })}
                        placeholder="XXXXX-XXXXXXX-X"
                        required
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Address (Optional)</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Document Uploads
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cnic_front">CNIC Front Image *</Label>
                      <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:border-primary/40 transition-colors">
                        <Input
                          id="cnic_front"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "cnic_front")}
                          required
                          className="hidden"
                        />
                        <label htmlFor="cnic_front" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <p className="text-sm text-muted-foreground">
                            {files.cnic_front ? files.cnic_front.name : "Click to upload"}
                          </p>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnic_back">CNIC Back Image *</Label>
                      <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:border-primary/40 transition-colors">
                        <Input
                          id="cnic_back"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "cnic_back")}
                          required
                          className="hidden"
                        />
                        <label htmlFor="cnic_back" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <p className="text-sm text-muted-foreground">
                            {files.cnic_back ? files.cnic_back.name : "Click to upload"}
                          </p>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="selfie">Selfie Holding CNIC *</Label>
                      <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:border-primary/40 transition-colors">
                        <Input
                          id="selfie"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "selfie")}
                          required
                          className="hidden"
                        />
                        <label htmlFor="selfie" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <p className="text-sm text-muted-foreground">
                            {files.selfie ? files.selfie.name : "Click to upload a clear selfie holding your CNIC"}
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Ensure all documents are clear and readable</li>
                    <li>Your CNIC should be valid and not expired</li>
                    <li>The selfie should clearly show your face and the CNIC</li>
                    <li>Verification typically takes 24-48 hours</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : existingKyc ? "Resubmit Documents" : "Submit for Verification"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
