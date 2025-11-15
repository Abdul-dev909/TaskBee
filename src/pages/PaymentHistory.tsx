import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowLeft, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import genieLamp from "@/assets/home-genie-logo.png";
interface Payment {
  id: string;
  job_id: string;
  homeowner_id: string;
  provider_id: string;
  offered_rate: number;
  platform_fee: number;
  total_amount: number;
  status: string;
  created_at: string;
  jobs?: {
    title: string;
  };
  profiles?: {
    full_name: string;
  };
}
const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      fetchPayments(session.user.id);
    };
    checkAuth();
  }, [navigate]);
  const fetchPayments = async (userId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from("payments").select(`
          *,
          jobs:job_id (title)
        `).eq("homeowner_id", userId).order("created_at", {
        ascending: false
      });
      if (error) throw error;

      // Fetch provider names separately
      const paymentsWithProviders = await Promise.all((data || []).map(async payment => {
        const {
          data: providerData
        } = await supabase.from("profiles").select("full_name").eq("id", payment.provider_id).single();
        return {
          ...payment,
          profiles: providerData
        };
      }));
      setPayments(paymentsWithProviders as any);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const downloadReceipt = (payment: Payment) => {
    const receiptContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HOME GENIE PAYMENT RECEIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Receipt ID: ${payment.id}
Date: ${new Date(payment.created_at).toLocaleDateString()}
Time: ${new Date(payment.created_at).toLocaleTimeString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JOB DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Job: ${payment.jobs?.title || 'N/A'}
Provider: ${payment.profiles?.full_name || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Service Cost:                Rs. ${payment.offered_rate}
Platform Fee:                Rs. ${payment.platform_fee}
                            ─────────────
TOTAL PAID:                  Rs. ${payment.total_amount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: ${payment.status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         Thank you for using Home Genie!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
    const blob = new Blob([receiptContent], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${payment.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Receipt Downloaded",
      description: "Your payment receipt has been downloaded successfully."
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/homeowner-dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <img src={genieLamp} alt="Home Genie" className="h-10 w-10" />
                <h1 className="text-2xl font-bold text-foreground">Payment History</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5
      }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                All Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8 text-muted-foreground">
                  Loading payment history...
                </div> : payments.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                  No payments found.
                </div> : <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Job</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead className="text-right">Service Cost</TableHead>
                        <TableHead className="text-right">Platform Fee</TableHead>
                        <TableHead className="text-right">Total Paid</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map(payment => <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{payment.jobs?.title || 'N/A'}</TableCell>
                          <TableCell>{payment.profiles?.full_name || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            Rs. {payment.offered_rate}
                          </TableCell>
                          <TableCell className="text-right">
                            Rs. {payment.platform_fee}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            Rs. {payment.total_amount}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white font-bold">
                                {payment.status}
                              </Badge>
                              <div className="relative">
                                <div className="absolute -inset-1 bg-green-500/20 rounded-full blur-sm"></div>
                                
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="outline" size="sm" onClick={() => downloadReceipt(payment)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>;
};
export default PaymentHistory;