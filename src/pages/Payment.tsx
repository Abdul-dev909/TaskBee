import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CreditCard, CheckCircle2, Smartphone, Copy, AlertCircle, Upload, Image, Building } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Platform mobile wallet number
const PLATFORM_WALLET_NUMBER = "03341421986";
const PLATFORM_ACCOUNT_TITLE = "Home Genie Services";

// Platform bank account details
const PLATFORM_BANK_NAME = "Meezan Bank - Toba Tek Singh Branch";
const PLATFORM_BANK_ACCOUNT_NUMBER = "59010111377917";
const PLATFORM_BANK_ACCOUNT_TITLE = "ABDUL REHMAN";
const PLATFORM_BANK_IBAN = "PK13MEZN0059010111377917";

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("jobId");
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "jazzcash" | "easypaisa" | "bank_transfer">("card");
  const [mobilePaymentPending, setMobilePaymentPending] = useState(false);
  
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [offeredRate, setOfferedRate] = useState(0);
  const platformFee = 49;
  
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  
  // Mobile payment screenshot
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    } else {
      toast.error("Invalid payment link");
      navigate("/homeowner-dashboard");
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("*, assigned_provider_id")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;

      // Check if already paid
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("job_id", jobId)
        .maybeSingle();

      if (existingPayment) {
        toast.error("This job has already been paid for");
        navigate("/homeowner-dashboard");
        return;
      }

      // Get the accepted offer
      const { data: acceptedOffer, error: offerError } = await supabase
        .from("job_requests")
        .select("proposed_rate")
        .eq("job_id", jobId)
        .eq("status", "accepted")
        .single();

      if (offerError || !acceptedOffer) {
        toast.error("No accepted offer found for this job");
        navigate("/homeowner-dashboard");
        return;
      }

      setJobDetails(job);
      setOfferedRate(Number(acceptedOffer.proposed_rate));
    } catch (error: any) {
      console.error("Error fetching job details:", error);
      toast.error("Failed to load payment details");
      navigate("/homeowner-dashboard");
    } finally {
      setLoading(false);
    }
  };

  const validateCard = () => {
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ""))) {
      toast.error("Card number must be 16 digits");
      return false;
    }

    if (!cardName.trim()) {
      toast.error("Please enter cardholder name");
      return false;
    }

    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiry)) {
      toast.error("Expiry must be in MM/YY format");
      return false;
    }

    const [month, year] = expiry.split("/").map(Number);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      toast.error("Card has expired");
      return false;
    }

    if (!/^\d{3}$/.test(cvv)) {
      toast.error("CVV must be 3 digits");
      return false;
    }

    return true;
  };

  const handleCardPayment = async () => {
    if (!validateCard()) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: { jobId, paymentMethod: "card" }
      });

      if (error) {
        console.error("Payment function error:", error);
        throw new Error(error.message || "Payment processing failed");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Payment processing failed");
      }

      setOfferedRate(data.offeredRate);
      setSuccess(true);
      toast.success("Payment successful!");
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setScreenshotPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleMobilePaymentSubmit = async () => {
    if (!screenshotFile) {
      toast.error("Please upload a screenshot of your payment");
      return;
    }

    setProcessing(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload screenshot
      setUploadingScreenshot(true);
      const fileExt = screenshotFile.name.split('.').pop();
      const fileName = `${user.id}/${jobId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment_screenshots')
        .upload(fileName, screenshotFile);

      if (uploadError) throw new Error("Failed to upload screenshot");

      // Get the URL for admin to view
      const screenshotPath = fileName;
      setUploadingScreenshot(false);

      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: { 
          jobId, 
          paymentMethod: paymentMethod,
          screenshotPath: screenshotPath
        }
      });

      if (error) {
        console.error("Payment function error:", error);
        throw new Error(error.message || "Payment processing failed");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Payment processing failed");
      }

      setOfferedRate(data.offeredRate);
      setSuccess(true);
      toast.success("Payment submitted for verification!");
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment submission failed. Please try again.");
    } finally {
      setProcessing(false);
      setUploadingScreenshot(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const totalAmount = offeredRate + platformFee;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>
              {paymentMethod === "card" ? "Payment Successful!" : "Payment Submitted!"}
            </CardTitle>
            <CardDescription>
              {paymentMethod === "card" 
                ? "Your payment has been processed" 
                : "Your payment will be verified within 24 hours"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Cost:</span>
                <span className="font-medium">Rs. {offeredRate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee:</span>
                <span className="font-medium">Rs. {platformFee}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Paid:</span>
                  <span className="text-primary">Rs. {totalAmount}</span>
                </div>
              </div>
              {paymentMethod !== "card" && (
                <div className="text-sm pt-2 text-center text-muted-foreground">
                  Screenshot uploaded for verification
                </div>
              )}
            </div>
            <Button onClick={() => navigate("/homeowner-dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </CardTitle>
          <CardDescription>Complete your payment for this job</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Breakdown */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h3 className="font-semibold mb-3">Payment Breakdown</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Cost:</span>
              <span className="font-medium">Rs. {offeredRate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Fee:</span>
              <span className="font-medium">Rs. {platformFee}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total Payable:</span>
                <span className="text-primary">Rs. {totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="card" className="text-xs sm:text-sm">
                <CreditCard className="h-4 w-4 mr-1 hidden sm:inline" />
                Card
              </TabsTrigger>
              <TabsTrigger value="jazzcash" className="text-xs sm:text-sm">
                <Smartphone className="h-4 w-4 mr-1 hidden sm:inline" />
                JazzCash
              </TabsTrigger>
              <TabsTrigger value="easypaisa" className="text-xs sm:text-sm">
                <Smartphone className="h-4 w-4 mr-1 hidden sm:inline" />
                Easypaisa
              </TabsTrigger>
              <TabsTrigger value="bank_transfer" className="text-xs sm:text-sm">
                <Building className="h-4 w-4 mr-1 hidden sm:inline" />
                Bank
              </TabsTrigger>
            </TabsList>

            {/* Card Payment */}
            <TabsContent value="card" className="space-y-4 mt-4">
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Test Mode:</strong> Use any test card details for simulation
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, "");
                      if (value.length <= 16 && /^\d*$/.test(value)) {
                        setCardNumber(value.replace(/(\d{4})/g, "$1 ").trim());
                      }
                    }}
                    maxLength={19}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                    <Input
                      id="expiry"
                      placeholder="12/25"
                      value={expiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + "/" + value.slice(2, 4);
                        }
                        setExpiry(value);
                      }}
                      maxLength={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      type="password"
                      value={cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 3) {
                          setCvv(value);
                        }
                      }}
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/homeowner-dashboard")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCardPayment}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay Rs. ${totalAmount}`
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* JazzCash Payment */}
            <TabsContent value="jazzcash" className="space-y-4 mt-4">
              {!mobilePaymentPending ? (
                <>
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      Send exactly <strong>Rs. {totalAmount}</strong> to complete payment
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-lg border-2 border-dashed border-red-300 dark:border-red-700 p-4 space-y-4 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-background">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">JC</span>
                      </div>
                      <span className="font-semibold text-red-700 dark:text-red-300">JazzCash</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Account Number</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background rounded px-3 py-2 font-mono text-lg border">
                            {PLATFORM_WALLET_NUMBER}
                          </code>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(PLATFORM_WALLET_NUMBER, "Number")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Account Title</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background rounded px-3 py-2 font-medium border">
                            {PLATFORM_ACCOUNT_TITLE}
                          </code>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(PLATFORM_ACCOUNT_TITLE, "Title")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Amount to Send</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background rounded px-3 py-2 font-bold text-lg text-primary border">
                            Rs. {totalAmount}
                          </code>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(totalAmount.toString(), "Amount")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>📱 Open JazzCash app → Send Money → Mobile Account</p>
                    <p>💳 Enter the number above and send exact amount</p>
                    <p>📸 Take a screenshot of the payment confirmation</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/homeowner-dashboard")}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setMobilePaymentPending(true)}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      I've Sent the Payment
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Payment Screenshot</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotSelect}
                        className="hidden"
                      />
                      
                      {screenshotPreview ? (
                        <div className="relative">
                          <img 
                            src={screenshotPreview} 
                            alt="Payment screenshot" 
                            className="w-full max-h-64 object-contain rounded-lg border"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setScreenshotFile(null);
                              setScreenshotPreview(null);
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                        >
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload your JazzCash payment screenshot
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload a screenshot showing the transaction confirmation from JazzCash
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobilePaymentPending(false);
                        setScreenshotFile(null);
                        setScreenshotPreview(null);
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleMobilePaymentSubmit}
                      disabled={processing || !screenshotFile}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {uploadingScreenshot ? "Uploading..." : "Submitting..."}
                        </>
                      ) : (
                        "Confirm Payment"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Easypaisa Payment */}
            <TabsContent value="easypaisa" className="space-y-4 mt-4">
              {!mobilePaymentPending ? (
                <>
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                    <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Send exactly <strong>Rs. {totalAmount}</strong> to complete payment
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-lg border-2 border-dashed border-green-300 dark:border-green-700 p-4 space-y-4 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">EP</span>
                      </div>
                      <span className="font-semibold text-green-700 dark:text-green-300">Easypaisa</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Account Number</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background rounded px-3 py-2 font-mono text-lg border">
                            {PLATFORM_WALLET_NUMBER}
                          </code>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(PLATFORM_WALLET_NUMBER, "Number")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Account Title</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background rounded px-3 py-2 font-medium border">
                            {PLATFORM_ACCOUNT_TITLE}
                          </code>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(PLATFORM_ACCOUNT_TITLE, "Title")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Amount to Send</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background rounded px-3 py-2 font-bold text-lg text-primary border">
                            Rs. {totalAmount}
                          </code>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(totalAmount.toString(), "Amount")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>📱 Open Easypaisa app → Send Money → Mobile Account</p>
                    <p>💳 Enter the number above and send exact amount</p>
                    <p>📸 Take a screenshot of the payment confirmation</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/homeowner-dashboard")}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setMobilePaymentPending(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      I've Sent the Payment
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Payment Screenshot</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotSelect}
                        className="hidden"
                      />
                      
                      {screenshotPreview ? (
                        <div className="relative">
                          <img 
                            src={screenshotPreview} 
                            alt="Payment screenshot" 
                            className="w-full max-h-64 object-contain rounded-lg border"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setScreenshotFile(null);
                              setScreenshotPreview(null);
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                        >
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload your Easypaisa payment screenshot
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload a screenshot showing the transaction confirmation from Easypaisa
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobilePaymentPending(false);
                        setScreenshotFile(null);
                        setScreenshotPreview(null);
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleMobilePaymentSubmit}
                      disabled={processing || !screenshotFile}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {uploadingScreenshot ? "Uploading..." : "Submitting..."}
                        </>
                      ) : (
                        "Confirm Payment"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Bank Transfer Payment */}
            <TabsContent value="bank_transfer" className="space-y-4 mt-4">
              {!mobilePaymentPending ? (
                <>
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      Transfer exactly <strong>Rs. {totalAmount}</strong> to the bank account below
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 p-4 space-y-4 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">Bank Transfer</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Bank Name</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background rounded px-3 py-2 font-medium border">
                            {PLATFORM_BANK_NAME}
                          </code>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(PLATFORM_BANK_NAME, "Bank name")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Account Number</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background rounded px-3 py-2 font-mono text-lg border">
                            {PLATFORM_BANK_ACCOUNT_NUMBER}
                          </code>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(PLATFORM_BANK_ACCOUNT_NUMBER, "Account number")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Account Title</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background rounded px-3 py-2 font-medium border">
                            {PLATFORM_BANK_ACCOUNT_TITLE}
                          </code>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(PLATFORM_BANK_ACCOUNT_TITLE, "Account title")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {PLATFORM_BANK_IBAN && (
                        <div>
                          <Label className="text-xs text-muted-foreground">IBAN</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 bg-background rounded px-3 py-2 font-mono border">
                              {PLATFORM_BANK_IBAN}
                            </code>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => copyToClipboard(PLATFORM_BANK_IBAN, "IBAN")}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-xs text-muted-foreground">Amount to Transfer</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background rounded px-3 py-2 font-bold text-lg text-primary border">
                            Rs. {totalAmount}
                          </code>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(totalAmount.toString(), "Amount")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>🏦 Open your banking app or visit your bank branch</p>
                    <p>💳 Transfer the exact amount to the account above</p>
                    <p>📸 Take a screenshot of the transfer confirmation</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/homeowner-dashboard")}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setMobilePaymentPending(true)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      I've Sent the Payment
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Bank Transfer Screenshot</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotSelect}
                        className="hidden"
                      />
                      
                      {screenshotPreview ? (
                        <div className="relative">
                          <img 
                            src={screenshotPreview} 
                            alt="Payment screenshot" 
                            className="w-full max-h-64 object-contain rounded-lg border"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setScreenshotFile(null);
                              setScreenshotPreview(null);
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                        >
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload your bank transfer screenshot
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload a screenshot showing the bank transfer confirmation
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobilePaymentPending(false);
                        setScreenshotFile(null);
                        setScreenshotPreview(null);
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleMobilePaymentSubmit}
                      disabled={processing || !screenshotFile}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {uploadingScreenshot ? "Uploading..." : "Submitting..."}
                        </>
                      ) : (
                        "Confirm Payment"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;
