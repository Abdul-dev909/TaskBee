import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Loader2, Search, Eye, CheckCircle, XCircle, Clock, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/AdminLayout";

const AdminPayments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = payments.filter((payment) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          payment.homeowner_profile?.full_name?.toLowerCase().includes(searchLower) ||
          payment.provider_profile?.full_name?.toLowerCase().includes(searchLower) ||
          payment.jobs?.title?.toLowerCase().includes(searchLower) ||
          payment.id.toLowerCase().includes(searchLower) ||
          payment.transaction_reference?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredPayments(filtered);
    } else {
      setFilteredPayments(payments);
    }
  }, [searchTerm, payments]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related data separately
      const paymentsWithDetails = await Promise.all(
        (data || []).map(async (payment) => {
          const [jobData, homeownerData, providerData] = await Promise.all([
            supabase.from("jobs").select("title").eq("id", payment.job_id).single(),
            supabase.from("profiles").select("full_name, email, phone").eq("id", payment.homeowner_id).single(),
            supabase.from("provider_profiles").select("full_name, phone").eq("user_id", payment.provider_id).maybeSingle(),
          ]);

          return {
            ...payment,
            jobs: jobData.data,
            homeowner_profile: homeownerData.data,
            provider_profile: providerData.data,
          };
        })
      );

      // Separate pending mobile payments
      const pending = paymentsWithDetails.filter(
        (p) => p.verification_status === "pending" && (p.payment_method === "jazzcash" || p.payment_method === "easypaisa")
      );
      const allPayments = paymentsWithDetails;

      setPendingPayments(pending);
      setPayments(allPayments);
      setFilteredPayments(allPayments);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const calculateCommission = (offeredRate: number) => {
    return Math.floor(offeredRate * 0.08);
  };

  const calculateProviderPayout = (offeredRate: number) => {
    return offeredRate - calculateCommission(offeredRate);
  };

  const viewDetails = (payment: any) => {
    setSelectedPayment(payment);
    setDetailsOpen(true);
  };

  const openVerifyDialog = (payment: any) => {
    setSelectedPayment(payment);
    setVerifyDialogOpen(true);
  };

  const openRejectDialog = (payment: any) => {
    setSelectedPayment(payment);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const verifyPayment = async () => {
    if (!selectedPayment) return;
    setProcessing(true);

    try {
      // Update payment status to verified
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "Paid",
          verification_status: "verified",
        })
        .eq("id", selectedPayment.id);

      if (paymentError) throw paymentError;

      // Calculate provider earnings
      const commission = calculateCommission(selectedPayment.offered_rate);
      const netAmount = selectedPayment.offered_rate - commission;

      // Create provider transaction
      const { error: transactionError } = await supabase
        .from("provider_transactions")
        .insert({
          provider_id: selectedPayment.provider_id,
          job_id: selectedPayment.job_id,
          gross_amount: selectedPayment.offered_rate,
          commission: commission,
          net_amount: netAmount,
        });

      if (transactionError) throw transactionError;

      // Update provider wallet
      const { data: walletData } = await supabase
        .from("provider_wallet")
        .select("balance")
        .eq("provider_id", selectedPayment.provider_id)
        .single();

      if (walletData) {
        await supabase
          .from("provider_wallet")
          .update({ balance: walletData.balance + netAmount })
          .eq("provider_id", selectedPayment.provider_id);
      } else {
        await supabase.from("provider_wallet").insert({
          provider_id: selectedPayment.provider_id,
          balance: netAmount,
        });
      }

      // Notify provider
      await supabase.from("notifications").insert({
        user_id: selectedPayment.provider_id,
        title: "Payment Verified! 💰",
        body: `Your ${selectedPayment.payment_method?.toUpperCase()} payment of Rs. ${selectedPayment.offered_rate} has been verified. Rs. ${netAmount} has been added to your wallet.`,
        type: "payment_verified",
        related_id: selectedPayment.job_id,
      });

      // Notify homeowner
      await supabase.from("notifications").insert({
        user_id: selectedPayment.homeowner_id,
        title: "Payment Confirmed ✅",
        body: `Your ${selectedPayment.payment_method?.toUpperCase()} payment for "${selectedPayment.jobs?.title}" has been verified successfully.`,
        type: "payment_confirmed",
        related_id: selectedPayment.job_id,
      });

      toast.success("Payment verified and funds released to provider");
      setVerifyDialogOpen(false);
      fetchPayments();
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      toast.error("Failed to verify payment");
    } finally {
      setProcessing(false);
    }
  };

  const rejectPayment = async () => {
    if (!selectedPayment) return;
    setProcessing(true);

    try {
      // Update payment status to rejected
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "Rejected",
          verification_status: "rejected",
        })
        .eq("id", selectedPayment.id);

      if (paymentError) throw paymentError;

      // Notify homeowner about rejection
      await supabase.from("notifications").insert({
        user_id: selectedPayment.homeowner_id,
        title: "Payment Rejected ❌",
        body: `Your ${selectedPayment.payment_method?.toUpperCase()} payment could not be verified. Reason: ${rejectionReason || "Transaction not found"}. Please contact support or try again.`,
        type: "payment_rejected",
        related_id: selectedPayment.job_id,
      });

      toast.success("Payment rejected and homeowner notified");
      setRejectDialogOpen(false);
      fetchPayments();
    } catch (error: any) {
      console.error("Error rejecting payment:", error);
      toast.error("Failed to reject payment");
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentMethodBadge = (method: string | null) => {
    switch (method) {
      case "jazzcash":
        return <Badge className="bg-red-500 text-white">JazzCash</Badge>;
      case "easypaisa":
        return <Badge className="bg-green-500 text-white">Easypaisa</Badge>;
      default:
        return <Badge variant="outline">Card</Badge>;
    }
  };

  const getStatusBadge = (payment: any) => {
    if (payment.verification_status === "pending") {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending Verification
        </Badge>
      );
    }
    if (payment.verification_status === "rejected") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        {payment.status}
      </Badge>
    );
  };

  const totalRevenue = filteredPayments.filter(p => p.verification_status === "verified").reduce((sum, p) => sum + p.platform_fee, 0);
  const totalCommission = filteredPayments.filter(p => p.verification_status === "verified").reduce((sum, p) => sum + calculateCommission(p.offered_rate), 0);
  const totalProcessed = filteredPayments.filter(p => p.verification_status === "verified").reduce((sum, p) => sum + p.total_amount, 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payments</h1>
          <p className="text-muted-foreground">Manage and verify all payment transactions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {totalProcessed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{filteredPayments.filter(p => p.verification_status === "verified").length} verified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Fixed Rs. 49 per job</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {totalCommission.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">8% from providers</p>
            </CardContent>
          </Card>

          <Card className={pendingPayments.length > 0 ? "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
              <Smartphone className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
              <p className="text-xs text-muted-foreground">Mobile payments awaiting review</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for All Payments vs Pending */}
        <Tabs defaultValue={pendingPayments.length > 0 ? "pending" : "all"} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pending Verification
              {pendingPayments.length > 0 && (
                <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingPayments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Payments</TabsTrigger>
          </TabsList>

          {/* Pending Payments Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Pending Mobile Payments
                </CardTitle>
                <CardDescription>
                  Verify JazzCash and Easypaisa transactions before releasing funds to providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingPayments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">No pending payments to verify</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPayments.map((payment) => (
                      <Card key={payment.id} className="border-yellow-200 dark:border-yellow-800">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getPaymentMethodBadge(payment.payment_method)}
                                <span className="font-semibold text-lg">Rs. {payment.total_amount}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Job: <span className="text-foreground font-medium">{payment.jobs?.title || "N/A"}</span>
                              </p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Homeowner</p>
                                  <p className="font-medium">{payment.homeowner_profile?.full_name || "N/A"}</p>
                                  <p className="text-xs text-muted-foreground">{payment.homeowner_profile?.phone}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Provider</p>
                                  <p className="font-medium">{payment.provider_profile?.full_name || "N/A"}</p>
                                </div>
                              </div>
                              <div className="bg-muted p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground">Transaction ID (provided by user)</p>
                                <p className="font-mono font-bold text-primary">{payment.transaction_reference || "Not provided"}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Submitted: {format(new Date(payment.created_at), "MMM dd, yyyy HH:mm")}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 md:min-w-[150px]">
                              <Button
                                onClick={() => openVerifyDialog(payment)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verify & Release
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => openRejectDialog(payment)}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Payments Tab */}
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Payment Transactions</CardTitle>
                <CardDescription>View all payment records and details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by homeowner, provider, job, ID, or transaction ref..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Job</TableHead>
                        <TableHead>Homeowner</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No payments found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                              {format(new Date(payment.created_at), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>{getPaymentMethodBadge(payment.payment_method)}</TableCell>
                            <TableCell>
                              <div className="max-w-[150px] truncate">{payment.jobs?.title || "N/A"}</div>
                            </TableCell>
                            <TableCell>{payment.homeowner_profile?.full_name || "N/A"}</TableCell>
                            <TableCell>{payment.provider_profile?.full_name || "N/A"}</TableCell>
                            <TableCell className="text-right font-semibold">Rs. {payment.total_amount}</TableCell>
                            <TableCell>{getStatusBadge(payment)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => viewDetails(payment)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>Detailed payment information</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment ID</p>
                  <p className="font-mono text-sm">{selectedPayment.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedPayment.created_at), "MMMM dd, yyyy HH:mm")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Job</p>
                  <p className="font-medium">{selectedPayment.jobs?.title || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedPayment)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  {getPaymentMethodBadge(selectedPayment.payment_method)}
                </div>
                {selectedPayment.transaction_reference && (
                  <div>
                    <p className="text-sm text-muted-foreground">Transaction Reference</p>
                    <p className="font-mono font-bold text-primary">{selectedPayment.transaction_reference}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Payment Breakdown</h4>
                <div className="space-y-2 bg-muted rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Cost:</span>
                    <span className="font-medium">Rs. {selectedPayment.offered_rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee (Homeowner):</span>
                    <span className="font-medium">Rs. {selectedPayment.platform_fee}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="font-semibold">Total Paid by Homeowner:</span>
                    <span className="font-semibold text-primary">Rs. {selectedPayment.total_amount}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Provider Payout</h4>
                <div className="space-y-2 bg-muted rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Amount:</span>
                    <span className="font-medium">Rs. {selectedPayment.offered_rate}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Platform Commission (8%):</span>
                    <span className="font-medium">-Rs. {calculateCommission(selectedPayment.offered_rate)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="font-semibold">Net Provider Payout:</span>
                    <span className="font-semibold text-green-600">
                      Rs. {calculateProviderPayout(selectedPayment.offered_rate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Parties</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Homeowner</p>
                    <p className="font-medium">{selectedPayment.homeowner_profile?.full_name || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">{selectedPayment.homeowner_profile?.email || ""}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="font-medium">{selectedPayment.provider_profile?.full_name || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Confirmation Dialog */}
      <AlertDialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Payment</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to verify this payment?</p>
              {selectedPayment && (
                <div className="bg-muted p-3 rounded-lg mt-2 text-foreground">
                  <p><strong>Amount:</strong> Rs. {selectedPayment.total_amount}</p>
                  <p><strong>Method:</strong> {selectedPayment.payment_method?.toUpperCase()}</p>
                  <p><strong>Transaction ID:</strong> {selectedPayment.transaction_reference || "N/A"}</p>
                  <p className="text-sm text-green-600 mt-2">
                    Rs. {calculateProviderPayout(selectedPayment.offered_rate)} will be added to the provider's wallet.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={verifyPayment}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Verify & Release Funds
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. The homeowner will be notified.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p><strong>Amount:</strong> Rs. {selectedPayment.total_amount}</p>
                <p><strong>Method:</strong> {selectedPayment.payment_method?.toUpperCase()}</p>
                <p><strong>Transaction ID:</strong> {selectedPayment.transaction_reference || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Rejection Reason</label>
                <Textarea
                  placeholder="e.g., Transaction ID not found, amount mismatch, duplicate submission..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={rejectPayment}
              disabled={processing}
              variant="destructive"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPayments;