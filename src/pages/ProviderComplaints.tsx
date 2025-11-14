import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Complaint {
  id: string;
  type: string;
  description: string;
  status: string;
  job_id: string | null;
  created_at: string;
  job_title?: string;
}

const ProviderComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch complaints
    const { data: complaintsData, error: complaintsError } = await supabase
      .from('complaints')
      .select('*')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false });

    if (complaintsError) {
      console.error('Error fetching complaints:', complaintsError);
      toast({
        title: "Error",
        description: "Failed to load complaints",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch job titles for complaints
    const jobIds = [...new Set(complaintsData?.map(c => c.job_id).filter(Boolean) || [])];
    const jobsResult = jobIds.length > 0 
      ? await supabase.from('jobs').select('id, title').in('id', jobIds)
      : { data: [] };

    const jobsMap = new Map<string, string>(jobsResult.data?.map(j => [j.id, j.title] as [string, string]) || []);

    const formattedComplaints = (complaintsData || []).map((complaint: any) => ({
      ...complaint,
      job_title: jobsMap.get(complaint.job_id) || 'N/A',
    }));

    setComplaints(formattedComplaints);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Pending: "secondary",
      "In Review": "default",
      Resolved: "outline",
      Rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Complaints Against Me</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>View Only - Contact Support for Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : complaints.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No complaints found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filed On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>{complaint.type}</TableCell>
                      <TableCell>{complaint.job_title}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{complaint.description}</TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                      <TableCell>{new Date(complaint.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderComplaints;
