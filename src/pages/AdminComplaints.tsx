import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Eye, Loader2 } from "lucide-react";

interface Complaint {
  id: string;
  created_by: string;
  provider_id: string | null;
  job_id: string | null;
  type: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  homeowner_email?: string;
  provider_name?: string;
  job_title?: string;
}

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        profiles!complaints_created_by_fkey(email),
        provider_profiles!complaints_provider_id_fkey(full_name),
        jobs!complaints_job_id_fkey(title)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching complaints:', error);
      toast({
        title: "Error",
        description: "Failed to load complaints",
        variant: "destructive",
      });
    } else {
      const formattedComplaints = (data || []).map((complaint: any) => ({
        ...complaint,
        homeowner_email: complaint.profiles?.email,
        provider_name: complaint.provider_profiles?.full_name || 'N/A',
        job_title: complaint.jobs?.title || 'N/A',
      }));
      setComplaints(formattedComplaints);
    }
    setLoading(false);
  };

  const updateComplaintStatus = async (complaintId: string, newStatus: string) => {
    setUpdatingStatus(true);
    const { error } = await supabase
      .from('complaints')
      .update({ 
        status: newStatus,
        admin_notes: adminNotes || null,
      })
      .eq('id', complaintId);

    setUpdatingStatus(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update complaint status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Complaint status updated successfully",
      });
      fetchComplaints();
      setSelectedComplaint(null);
      setAdminNotes("");
    }
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

  const filteredComplaints = filterStatus === "all" 
    ? complaints 
    : complaints.filter(c => c.status === filterStatus);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Complaints</h1>
            <p className="text-muted-foreground">View and manage user complaints</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Complaints</CardTitle>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredComplaints.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No complaints found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>{complaint.homeowner_email}</TableCell>
                      <TableCell>{complaint.type}</TableCell>
                      <TableCell>{complaint.provider_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{complaint.job_title}</TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                      <TableCell>{new Date(complaint.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setAdminNotes(complaint.admin_notes || "");
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Complaint Details</DialogTitle>
                            </DialogHeader>
                            {selectedComplaint && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Type</Label>
                                  <p className="text-sm mt-1">{selectedComplaint.type}</p>
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedComplaint.description}</p>
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <Select
                                    value={selectedComplaint.status}
                                    onValueChange={(value) => setSelectedComplaint({ ...selectedComplaint, status: value })}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Pending">Pending</SelectItem>
                                      <SelectItem value="In Review">In Review</SelectItem>
                                      <SelectItem value="Resolved">Resolved</SelectItem>
                                      <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Admin Notes</Label>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add internal notes..."
                                    rows={4}
                                    className="mt-1"
                                  />
                                </div>
                                <Button
                                  onClick={() => updateComplaintStatus(selectedComplaint.id, selectedComplaint.status)}
                                  disabled={updatingStatus}
                                  className="w-full"
                                >
                                  {updatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Update Complaint
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminComplaints;
