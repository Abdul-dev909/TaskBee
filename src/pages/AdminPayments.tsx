import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, Loader2, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminLayout from "@/components/AdminLayout";

const AdminPayments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
          payment.id.toLowerCase().includes(searchLower)
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
        .select(`
          *,
          jobs(title),
          homeowner_profile:profiles!payments_homeowner_id_fkey(full_name, email),
          provider_profile:provider_profiles!payments_provider_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPayments(data || []);
      setFilteredPayments(data || []);
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

  const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.platform_fee, 0);
  const totalCommission = filteredPayments.reduce((sum, p) => sum + calculateCommission(p.offered_rate), 0);
  const totalProcessed = filteredPayments.reduce((sum, p) => sum + p.total_amount, 0);

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
          <p className="text-muted-foreground">Manage and monitor all payment transactions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {totalProcessed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{filteredPayments.length} transactions</p>
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
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Transactions</CardTitle>
            <CardDescription>View all payment records and details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by homeowner, provider, job, or ID..."
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
                    <TableHead>Job</TableHead>
                    <TableHead>Homeowner</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Offered Rate</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right">Commission (8%)</TableHead>
                    <TableHead className="text-right">Provider Payout</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {format(new Date(payment.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[150px] truncate">{payment.jobs?.title || "N/A"}</div>
                        </TableCell>
                        <TableCell>{payment.homeowner_profile?.full_name || "N/A"}</TableCell>
                        <TableCell>{payment.provider_profile?.full_name || "N/A"}</TableCell>
                        <TableCell className="text-right">Rs. {payment.offered_rate}</TableCell>
                        <TableCell className="text-right">Rs. {payment.platform_fee}</TableCell>
                        <TableCell className="text-right">
                          Rs. {calculateCommission(payment.offered_rate)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          Rs. {calculateProviderPayout(payment.offered_rate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewDetails(payment)}
                          >
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
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {selectedPayment.status}
                  </Badge>
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
    </AdminLayout>
  );
};

export default AdminPayments;