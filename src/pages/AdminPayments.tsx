import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Loader2, Search, Eye, CheckCircle, XCircle, Clock, Smartphone, ArrowUpRight, Building, Image } from "lucide-react";
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
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [withdrawalRejectDialogOpen, setWithdrawalRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotDialogOpen, setScreenshotDialogOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchWithdrawals();
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

      const pending = paymentsWithDetails.filter(
        (p) => p.verification_status === "pending" && (p.payment_method === "jazzcash" || p.payment_method === "easypaisa")
      );

      setPendingPayments(pending);
      setPayments(paymentsWithDetails);
      setFilteredPayments(paymentsWithDetails);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const withdrawalsWithDetails = await Promise.all(
        (data || []).map(async (withdrawal) => {
          const { data: providerData } = await supabase
            .from("provider_profiles")
            .select("full_name, phone")
            .eq("user_id", withdrawal.provider_id)
            .maybeSingle();

          const { data: walletData } = await supabase
            .from("provider_wallet")
            .select("balance")
            .eq("provider_id", withdrawal.provider_id)
            .maybeSingle();

          return {
            ...withdrawal,
            provider_profile: providerData,
            wallet_balance: walletData?.balance || 0,
          };
        })
      );

      const pending = withdrawalsWithDetails.filter((w) => w.status === "pending");
      setPendingWithdrawals(pending);
      setWithdrawals(withdrawalsWithDetails);
    } catch (error: any) {
      console.error("Error fetching withdrawals:", error);
    }
  };

  const calculateCommission = (offeredRate: number) => Math.floor(offeredRate * 0.08);
  const calculateProviderPayout = (offeredRate: number) => offeredRate - calculateCommission(offeredRate);

  const viewDetails = (payment: any) => {
    setSelectedPayment(payment);
    setDetailsOpen(true);
  };

  const viewScreenshot = async (payment: any) => {
    if (!payment.payment_screenshot_url) {
      toast.error("No screenshot available");
      return;
    }

    try {
      const { data } = await supabase.storage
        .from("payment_screenshots")
        .createSignedUrl(payment.payment_screenshot_url, 300);

      if (data?.signedUrl) {
        setScreenshotUrl(data.signedUrl);
        setSelectedPayment(payment);
        setScreenshotDialogOpen(true);
      } else {
        toast.error("Failed to load screenshot");
      }
    } catch (error) {
      console.error("Error loading screenshot:", error);
      toast.error("Failed to load screenshot");
    }
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
      const { error: paymentError } = await supabase
        .from("payments")
        .update({ status: "Paid", verification_status: "verified" })
        .eq("id", selectedPayment.id);

      if (paymentError) throw paymentError;

      const commission = calculateCommission(selectedPayment.offered_rate);
      const netAmount = selectedPayment.offered_rate - commission;

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

      await supabase.from("notifications").insert({
        user_id: selectedPayment.provider_id,
        title: "Payment Verified! 💰",
        body: `Your ${selectedPayment.payment_method?.toUpperCase()} payment of Rs. ${selectedPayment.offered_rate} has been verified. Rs. ${netAmount} has been added to your wallet.`,
        type: "payment_verified",
        related_id: selectedPayment.job_id,
      });

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
      const { error: paymentError } = await supabase
        .from("payments")
        .update({ status: "Rejected", verification_status: "rejected" })
        .eq("id", selectedPayment.id);

      if (paymentError) throw paymentError;

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

  const openWithdrawalComplete = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    setWithdrawalDialogOpen(true);
  };

  const openWithdrawalReject = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    setRejectionReason("");
    setWithdrawalRejectDialogOpen(true);
  };

  const completeWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    setProcessing(true);

    try {
      // Update withdrawal status
      const { error: withdrawalError } = await supabase
        .from("withdrawal_requests")
        .update({ status: "completed", processed_at: new Date().toISOString() })
        .eq("id", selectedWithdrawal.id);

      if (withdrawalError) throw withdrawalError;

      // Deduct from wallet
      const { data: walletData } = await supabase
        .from("provider_wallet")
        .select("balance")
        .eq("provider_id", selectedWithdrawal.provider_id)
        .single();

      if (walletData) {
        const newBalance = Math.max(0, walletData.balance - selectedWithdrawal.amount);
        await supabase
          .from("provider_wallet")
          .update({ balance: newBalance })
          .eq("provider_id", selectedWithdrawal.provider_id);
      }

      // Notify provider
      await supabase.from("notifications").insert({
        user_id: selectedWithdrawal.provider_id,
        title: "Withdrawal Completed! 💸",
        body: `Your withdrawal of Rs. ${selectedWithdrawal.amount} to ${selectedWithdrawal.withdrawal_method.toUpperCase()} (${selectedWithdrawal.account_number}) has been processed.`,
        type: "withdrawal_completed",
      });

      toast.success("Withdrawal marked as completed");
      setWithdrawalDialogOpen(false);
      fetchWithdrawals();
      fetchPayments();
    } catch (error: any) {
      console.error("Error completing withdrawal:", error);
      toast.error("Failed to complete withdrawal");
    } finally {
      setProcessing(false);
    }
  };

  const rejectWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    setProcessing(true);

    try {
      const { error: withdrawalError } = await supabase
        .from("withdrawal_requests")
        .update({ 
          status: "rejected", 
          admin_notes: rejectionReason,
          processed_at: new Date().toISOString() 
        })
        .eq("id", selectedWithdrawal.id);

      if (withdrawalError) throw withdrawalError;

      await supabase.from("notifications").insert({
        user_id: selectedWithdrawal.provider_id,
        title: "Withdrawal Rejected ❌",
        body: `Your withdrawal request of Rs. ${selectedWithdrawal.amount} was rejected. Reason: ${rejectionReason || "Invalid account details"}`,
        type: "withdrawal_rejected",
      });

      toast.success("Withdrawal rejected");
      setWithdrawalRejectDialogOpen(false);
      fetchWithdrawals();
    } catch (error: any) {
      console.error("Error rejecting withdrawal:", error);
      toast.error("Failed to reject withdrawal");
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
          Pending
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

  const getWithdrawalMethodIcon = (method: string) => {
    switch (method) {
      case "jazzcash":
      case "easypaisa":
        return <Smartphone className="h-4 w-4" />;
      case "bank":
        return <Building className="h-4 w-4" />;
      default:
        return null;
    }
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
          <h1 className="text-3xl font-bold mb-2">Payments & Withdrawals</h1>
          <p className="text-muted-foreground">Manage payment verifications and provider withdrawals</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {totalProcessed.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {totalCommission.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className={pendingPayments.length > 0 ? "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Smartphone className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
            </CardContent>
          </Card>

          <Card className={pendingWithdrawals.length > 0 ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingWithdrawals.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={pendingPayments.length > 0 ? "pending" : pendingWithdrawals.length > 0 ? "withdrawals" : "all"} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pending Payments
              {pendingPayments.length > 0 && (
                <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingPayments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="relative">
              Withdrawals
              {pendingWithdrawals.length > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingWithdrawals.length}
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
                  Verify JazzCash and Easypaisa payments by viewing uploaded screenshots
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
                            <div className="space-y-2 flex-1">
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
                              <p className="text-xs text-muted-foreground">
                                Submitted: {format(new Date(payment.created_at), "MMM dd, yyyy HH:mm")}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 md:min-w-[180px]">
                              <Button
                                variant="outline"
                                onClick={() => viewScreenshot(payment)}
                                disabled={!payment.payment_screenshot_url}
                              >
                                <Image className="h-4 w-4 mr-2" />
                                View Screenshot
                              </Button>
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

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-orange-600" />
                  Provider Withdrawal Requests
                </CardTitle>
                <CardDescription>
                  Process provider withdrawal requests to their bank/mobile accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-medium">No withdrawal requests</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Account Details</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.map((withdrawal) => (
                          <TableRow key={withdrawal.id} className={withdrawal.status === "pending" ? "bg-orange-50/50 dark:bg-orange-950/20" : ""}>
                            <TableCell className="font-medium">
                              {format(new Date(withdrawal.created_at), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{withdrawal.provider_profile?.full_name || "N/A"}</span>
                                <span className="text-xs text-muted-foreground">{withdrawal.provider_profile?.phone}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getWithdrawalMethodIcon(withdrawal.withdrawal_method)}
                                <span className="capitalize">{withdrawal.withdrawal_method}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{withdrawal.account_title}</span>
                                <span className="text-sm font-mono">{withdrawal.account_number}</span>
                                {withdrawal.bank_name && (
                                  <span className="text-xs text-muted-foreground">{withdrawal.bank_name}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              Rs. {withdrawal.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              Rs. {withdrawal.wallet_balance?.toLocaleString() || 0}
                            </TableCell>
                            <TableCell>
                              {withdrawal.status === "pending" && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>
                              )}
                              {withdrawal.status === "completed" && (
                                <Badge className="bg-green-500">Completed</Badge>
                              )}
                              {withdrawal.status === "rejected" && (
                                <Badge variant="destructive">Rejected</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {withdrawal.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => openWithdrawalComplete(withdrawal)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openWithdrawalReject(withdrawal)}
                                    className="border-red-300 text-red-600"
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                <CardDescription>View all payment records</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by homeowner, provider, job..."
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

      {/* Screenshot Dialog */}
      <Dialog open={screenshotDialogOpen} onOpenChange={setScreenshotDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
            <DialogDescription>
              {selectedPayment?.payment_method?.toUpperCase()} payment of Rs. {selectedPayment?.total_amount}
            </DialogDescription>
          </DialogHeader>
          {screenshotUrl && (
            <div className="flex justify-center">
              <img 
                src={screenshotUrl} 
                alt="Payment screenshot" 
                className="max-h-[500px] object-contain rounded-lg border"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScreenshotDialogOpen(false)}>Close</Button>
            <Button onClick={() => { setScreenshotDialogOpen(false); openVerifyDialog(selectedPayment); }} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Payment Breakdown</h4>
                <div className="space-y-2 bg-muted rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Cost:</span>
                    <span className="font-medium">Rs. {selectedPayment.offered_rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee:</span>
                    <span className="font-medium">Rs. {selectedPayment.platform_fee}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold text-primary">Rs. {selectedPayment.total_amount}</span>
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

      {/* Verify Payment Dialog */}
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
                  <p className="text-sm text-green-600 mt-2">
                    Rs. {calculateProviderPayout(selectedPayment.offered_rate)} will be added to the provider's wallet.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={verifyPayment} disabled={processing} className="bg-green-600 hover:bg-green-700">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Verify & Release
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Payment Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p><strong>Amount:</strong> Rs. {selectedPayment.total_amount}</p>
                <p><strong>Method:</strong> {selectedPayment.payment_method?.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Rejection Reason</label>
                <Textarea
                  placeholder="e.g., Screenshot unclear, amount mismatch..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={processing}>Cancel</Button>
            <Button onClick={rejectPayment} disabled={processing} variant="destructive">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Withdrawal Dialog */}
      <AlertDialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Withdrawal as Completed</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Confirm that you have sent the funds to the provider.</p>
              {selectedWithdrawal && (
                <div className="bg-muted p-3 rounded-lg mt-2 text-foreground space-y-1">
                  <p><strong>Amount:</strong> Rs. {selectedWithdrawal.amount}</p>
                  <p><strong>Method:</strong> {selectedWithdrawal.withdrawal_method?.toUpperCase()}</p>
                  <p><strong>Account:</strong> {selectedWithdrawal.account_number}</p>
                  <p><strong>Title:</strong> {selectedWithdrawal.account_title}</p>
                  {selectedWithdrawal.bank_name && <p><strong>Bank:</strong> {selectedWithdrawal.bank_name}</p>}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={completeWithdrawal} disabled={processing} className="bg-green-600 hover:bg-green-700">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Mark Completed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Withdrawal Dialog */}
      <Dialog open={withdrawalRejectDialogOpen} onOpenChange={setWithdrawalRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this withdrawal request.
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p><strong>Amount:</strong> Rs. {selectedWithdrawal.amount}</p>
                <p><strong>Account:</strong> {selectedWithdrawal.account_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Rejection Reason</label>
                <Textarea
                  placeholder="e.g., Invalid account number, account verification failed..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawalRejectDialogOpen(false)} disabled={processing}>Cancel</Button>
            <Button onClick={rejectWithdrawal} disabled={processing} variant="destructive">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPayments;