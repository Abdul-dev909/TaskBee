import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ProviderWallet = () => {
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

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
    } catch (error: any) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to load wallet information");
    } finally {
      setLoading(false);
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
        <p className="text-muted-foreground">Manage your earnings and transactions</p>
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
          <div className="text-4xl font-bold text-primary">Rs. {walletBalance.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground mt-2">Total earnings after commission</p>
        </CardContent>
      </Card>

      {/* Transactions Table */}
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
    </div>
  );
};

export default ProviderWallet;