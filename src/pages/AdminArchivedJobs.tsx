import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Archive, Trash2, RefreshCw, Loader2, Calendar, Database } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StorageUsageCard } from "@/components/StorageUsageCard";

interface ArchivedJob {
  id: string;
  title: string;
  category: string;
  city: string;
  status: string;
  original_created_at: string;
  archived_at: string;
  posted_by: string;
}

const AdminArchivedJobs = () => {
  const { toast } = useToast();
  const [archivedJobs, setArchivedJobs] = useState<ArchivedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [daysOld, setDaysOld] = useState(90);
  const [stats, setStats] = useState({
    archivedJobs: 0,
    archivedMessages: 0,
  });

  useEffect(() => {
    fetchArchivedData();
  }, []);

  const fetchArchivedData = async () => {
    setLoading(true);
    try {
      // Fetch archived jobs
      const { data: jobs, error: jobsError } = await supabase
        .from("archived_jobs")
        .select("*")
        .order("archived_at", { ascending: false });

      if (jobsError) throw jobsError;
      setArchivedJobs(jobs || []);

      // Fetch stats
      const { count: jobsCount } = await supabase
        .from("archived_jobs")
        .select("*", { count: "exact", head: true });

      const { count: messagesCount } = await supabase
        .from("archived_messages")
        .select("*", { count: "exact", head: true });

      setStats({
        archivedJobs: jobsCount || 0,
        archivedMessages: messagesCount || 0,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch archived data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runManualCleanup = async () => {
    setCleanupLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cleanup-old-data", {
        body: { days_old: daysOld },
      });

      if (error) throw error;

      toast({
        title: "Cleanup Completed",
        description: `Archived ${data.result?.archived_jobs || 0} jobs and ${data.result?.archived_messages || 0} messages`,
      });

      // Refresh data
      fetchArchivedData();
    } catch (error: any) {
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to run cleanup",
        variant: "destructive",
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleDeleteArchivedJob = async (jobId: string) => {
    try {
      // First delete associated archived messages
      await supabase
        .from("archived_messages")
        .delete()
        .eq("job_id", jobId);

      // Then delete the archived job
      const { error } = await supabase
        .from("archived_jobs")
        .delete()
        .eq("id", jobId);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Archived job permanently deleted",
      });

      fetchArchivedData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete archived job",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "assigned":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Archived Data</h1>
          <p className="text-muted-foreground">View archived jobs and run manual cleanup</p>
        </div>

        {/* Storage Usage Card */}
        <StorageUsageCard autoRefreshInterval={15000} className="max-w-md" />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Archived Jobs</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.archivedJobs}</div>
              <p className="text-xs text-muted-foreground">Total archived job records</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Archived Messages</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.archivedMessages}</div>
              <p className="text-xs text-muted-foreground">Total archived message records</p>
            </CardContent>
          </Card>

          <Card className="glass-card md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Manual Cleanup</CardTitle>
              <CardDescription>Archive completed jobs older than specified days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daysOld">Days old threshold</Label>
                  <Input
                    id="daysOld"
                    type="number"
                    value={daysOld}
                    onChange={(e) => setDaysOld(Number(e.target.value))}
                    min={1}
                    max={365}
                    className="w-24"
                  />
                </div>
                <Button
                  onClick={runManualCleanup}
                  disabled={cleanupLoading}
                  className="gap-2"
                >
                  {cleanupLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Run Cleanup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Archived Jobs Table */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Archived Jobs</CardTitle>
              <CardDescription>Jobs that have been moved to archive</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchArchivedData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : archivedJobs.length === 0 ? (
              <div className="text-center py-8">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No archived jobs yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Completed jobs older than 90 days will be automatically archived
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Original Date</TableHead>
                      <TableHead>Archived Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archivedJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.category}</TableCell>
                        <TableCell>{job.city}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(job.status)}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(job.original_created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Archive className="h-3 w-3" />
                            {new Date(job.archived_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Permanently Delete</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this archived job and its messages. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteArchivedJob(job.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Permanently
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </AdminLayout>
  );
};

export default AdminArchivedJobs;
