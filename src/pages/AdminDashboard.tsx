import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, CheckCircle, Clock, FileText, MessageSquare, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { AdminAnnouncements } from "@/components/AdminAnnouncements";
import { StorageUsageCard } from "@/components/StorageUsageCard";
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalHomeowners: 0,
    totalProviders: 0,
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalOffers: 0,
    pendingKyc: 0,
    verifiedProviders: 0,
    unverifiedProviders: 0,
    rejectedKyc: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Count homeowners
      const { count: homeownersCount, error: homeownersError } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "homeowner");

      if (homeownersError) console.error("Homeowners count error:", homeownersError);

      // Count service providers
      const { count: providersCount, error: providersError } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "service_provider");

      if (providersError) console.error("Providers count error:", providersError);

      // Count total jobs
      const { count: totalJobsCount, error: totalJobsError } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true });

      if (totalJobsError) console.error("Total jobs count error:", totalJobsError);

      // Count active (open) jobs
      const { count: activeJobsCount, error: activeJobsError } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      if (activeJobsError) console.error("Active jobs count error:", activeJobsError);

      // Count completed jobs
      const { count: completedJobsCount, error: completedJobsError } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      if (completedJobsError) console.error("Completed jobs count error:", completedJobsError);

      // Count total job offers (requests)
      const { count: offersCount, error: offersError } = await supabase
        .from("job_requests")
        .select("*", { count: "exact", head: true });

      if (offersError) console.error("Job offers count error:", offersError);

      // Count pending KYC verifications
      const { count: pendingKycCount, error: pendingKycError } = await supabase
        .from("provider_kyc")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (pendingKycError) console.error("Pending KYC count error:", pendingKycError);

      // Count verified providers
      const { count: verifiedCount, error: verifiedError } = await supabase
        .from("provider_kyc")
        .select("*", { count: "exact", head: true })
        .eq("status", "verified");

      if (verifiedError) console.error("Verified count error:", verifiedError);

      // Count unverified providers
      const { count: unverifiedCount, error: unverifiedError } = await supabase
        .from("provider_kyc")
        .select("*", { count: "exact", head: true })
        .eq("status", "unverified");

      if (unverifiedError) console.error("Unverified count error:", unverifiedError);

      // Count rejected KYC
      const { count: rejectedCount, error: rejectedError } = await supabase
        .from("provider_kyc")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected");

      if (rejectedError) console.error("Rejected KYC count error:", rejectedError);

      setStats({
        totalHomeowners: homeownersCount || 0,
        totalProviders: providersCount || 0,
        totalJobs: totalJobsCount || 0,
        activeJobs: activeJobsCount || 0,
        completedJobs: completedJobsCount || 0,
        totalOffers: offersCount || 0,
        pendingKyc: pendingKycCount || 0,
        verifiedProviders: verifiedCount || 0,
        unverifiedProviders: unverifiedCount || 0,
        rejectedKyc: rejectedCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const statCards = [
    {
      title: "Total Homeowners",
      value: stats.totalHomeowners,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Service Providers",
      value: stats.totalProviders,
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Total Jobs Posted",
      value: stats.totalJobs,
      icon: Briefcase,
      color: "text-purple-600",
    },
    {
      title: "Active (Open) Jobs",
      value: stats.activeJobs,
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Completed Jobs",
      value: stats.completedJobs,
      icon: CheckCircle,
      color: "text-green-700",
    },
    {
      title: "Total Job Offers",
      value: stats.totalOffers,
      icon: MessageSquare,
      color: "text-indigo-600",
    },
  ];

  const kycCards = [
    {
      title: "Pending Verifications",
      value: stats.pendingKyc,
      icon: Clock,
      color: "text-yellow-600",
      clickable: true,
    },
    {
      title: "Verified Providers",
      value: stats.verifiedProviders,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Unverified Providers",
      value: stats.unverifiedProviders,
      icon: Shield,
      color: "text-gray-600",
    },
    {
      title: "Rejected KYC",
      value: stats.rejectedKyc,
      icon: FileText,
      color: "text-red-600",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">Monitor key platform metrics and activity</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              KYC Verification Status
            </h2>
            <Button onClick={() => navigate('/admin/kyc-verification')}>
              View All Verifications
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kycCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card 
                  key={index} 
                  className={`glass-card ${card.clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                  onClick={() => card.clickable && navigate('/admin/kyc-verification')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Storage Usage Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">System Health</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StorageUsageCard autoRefreshInterval={30000} />
          </div>
        </div>

        <AdminAnnouncements />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
