import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CreditCard, CheckCircle2 } from "lucide-react";

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("jobId");
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [offeredRate, setOfferedRate] = useState(0);
  const platformFee = 49;
  
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

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
    // Card number: 16 digits
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ""))) {
      toast.error("Card number must be 16 digits");
      return false;
    }

    // Name: not empty
    if (!cardName.trim()) {
      toast.error("Please enter cardholder name");
      return false;
    }

    // Expiry: MM/YY format and in future
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

    // CVV: 3 digits
    if (!/^\d{3}$/.test(cvv)) {
      toast.error("CVV must be 3 digits");
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateCard()) return;

    setProcessing(true);
    try {
      // Call secure server-side payment processing
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: { jobId }
      });

      if (error) {
        console.error("Payment function error:", error);
        throw new Error(error.message || "Payment processing failed");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Payment processing failed");
      }

      // Update local state with server-returned values
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle>Payment Successful!</CardTitle>
            <CardDescription>Your payment has been processed</CardDescription>
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
                  <span className="text-primary">Rs. {offeredRate + platformFee}</span>
                </div>
              </div>
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
      <Card className="w-full max-w-md">
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
                <span className="text-primary">Rs. {offeredRate + platformFee}</span>
              </div>
            </div>
          </div>

          {/* Test Card Info */}
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Test Mode:</strong> Use any test card details for simulation
            </p>
          </div>

          {/* Card Input Form */}
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

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/homeowner-dashboard")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay Rs. ${offeredRate + platformFee}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;