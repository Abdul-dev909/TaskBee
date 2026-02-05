import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, TrendingUp, Loader2, ArrowUpRight, Smartphone, Building } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProviderWallet = () => {
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  
  // Withdrawal form state
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawalMethod, setWithdrawalMethod] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [bankName, setBankName] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from("provider_wallet")
        .select("balance")
        .eq("provider_id", user.id)
        .maybeSingle();

      if (walletError && walletError.code !== "PGRST116") throw walletError;

      setWalletBalance(wallet?.balance || 0);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("provider_transactions")
        .select("*, jobs(title)")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (transactionsError) throw transactionsError;

      setTransactions(transactionsData || []);

      // Fetch withdrawal requests
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (withdrawalError) throw withdrawalError;
      setWithdrawals(withdrawalData || []);

    } catch (error: any) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to load wallet information");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = async () => {
    if (!withdrawalMethod) {
      toast.error("Please select a withdrawal method");
      return;
    }
    if (!accountNumber.trim()) {
      toast.error("Please enter your account number");
      return;
    }
    if (!accountTitle.trim()) {
      toast.error("Please enter the account title");
      return;
    }
    if (withdrawalMethod === "bank" && !bankName.trim()) {
      toast.error("Please enter your bank name");
      return;
    }

    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount < 500) {
      toast.error("Minimum withdrawal amount is Rs. 500");
      return;
    }
    if (amount > walletBalance) {
      toast.error("Insufficient balance");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("withdrawal_requests")
        .insert({
          provider_id: user.id,
          amount: amount,
          withdrawal_method: withdrawalMethod,
          account_number: accountNumber.trim(),
          account_title: accountTitle.trim(),
          bank_name: withdrawalMethod === "bank" ? bankName.trim() : null,
        });

      if (error) throw error;

      toast.success("Withdrawal request submitted! Admin will process it shortly.");
      setWithdrawDialogOpen(false);
      resetWithdrawForm();
      fetchWalletData();
    } catch (error: any) {
      console.error("Error submitting withdrawal:", error);
      toast.error("Failed to submit withdrawal request");
    } finally {
      setSubmitting(false);
    }
  };

  const resetWithdrawForm = () => {
    setWithdrawalMethod("");
    setAccountNumber("");
    setAccountTitle("");
    setBankName("");
    setWithdrawAmount("");
  };

  const getMethodIcon = (method: string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
        <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Available Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold text-primary">Rs. {walletBalance.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground mt-2">Total earnings after commission</p>
            </div>
            <Button 
              onClick={() => setWithdrawDialogOpen(true)}
              disabled={walletBalance < 500}
              className="gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              Withdraw
            </Button>
          </div>
          {walletBalance < 500 && (
            <p className="text-xs text-muted-foreground mt-3">
              Minimum Rs. 500 required for withdrawal
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Transactions and Withdrawals */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="withdrawals">
            Withdrawal Requests
            {withdrawals.filter(w => w.status === "pending").length > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {withdrawals.filter(w => w.status === "pending").length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>Your payment history and commission details</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Job</TableHead>
                        <TableHead className="text-right">Gross Amount</TableHead>
                        <TableHead className="text-right">Commission (8%)</TableHead>
                        <TableHead className="text-right">Net Payout</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {format(new Date(transaction.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{transaction.jobs?.title || "Unknown Job"}</span>
                              <span className="text-xs text-muted-foreground">{transaction.job_id.slice(0, 8)}...</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">Rs. {transaction.gross_amount}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="text-red-600">
                              -Rs. {transaction.commission}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-green-600">
                              Rs. {transaction.net_amount}
                            </span>
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

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                Withdrawal Requests
              </CardTitle>
              <CardDescription>Track your withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No withdrawal requests yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell className="font-medium">
                            {format(new Date(withdrawal.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getMethodIcon(withdrawal.withdrawal_method)}
                              <span className="capitalize">{withdrawal.withdrawal_method}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{withdrawal.account_title}</span>
                              <span className="text-xs text-muted-foreground">{withdrawal.account_number}</span>
                              {withdrawal.bank_name && (
                                <span className="text-xs text-muted-foreground">{withdrawal.bank_name}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            Rs. {withdrawal.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(withdrawal.status)}
                            {withdrawal.admin_notes && withdrawal.status === "rejected" && (
                              <p className="text-xs text-red-600 mt-1">{withdrawal.admin_notes}</p>
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
      </Tabs>

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Enter your account details to receive your funds. Admin will process the request manually.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Withdrawal Method</Label>
              <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jazzcash">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-red-600" />
                      JazzCash
                    </div>
                  </SelectItem>
                  <SelectItem value="easypaisa">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-green-600" />
                      Easypaisa
                    </div>
                  </SelectItem>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {withdrawalMethod === "bank" && (
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="e.g., HBL, Meezan, UBL"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="accountNumber">
                {withdrawalMethod === "bank" ? "Account Number / IBAN" : "Mobile Number"}
              </Label>
              <Input
                id="accountNumber"
                placeholder={withdrawalMethod === "bank" ? "e.g., PK36..." : "e.g., 03XX-XXXXXXX"}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountTitle">Account Title</Label>
              <Input
                id="accountTitle"
                placeholder="Account holder name"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Rs.)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={walletBalance}
              />
              <p className="text-xs text-muted-foreground">
                Available: Rs. {walletBalance.toLocaleString()} | Minimum: Rs. 500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdrawRequest} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderWallet;