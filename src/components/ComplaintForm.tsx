import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { checkRateLimit } from "@/hooks/useRateLimit";
import { z } from "zod";

const complaintSchema = z.object({
  type: z.string().min(1, "Complaint type is required"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be less than 2000 characters")
    .trim(),
  providerId: z.string().min(1, "Provider is required"),
});

interface ComplaintFormProps {
  preselectedJobId?: string;
  preselectedProviderId?: string;
  onSuccess?: () => void;
}

export const ComplaintForm = ({ preselectedJobId, preselectedProviderId, onSuccess }: ComplaintFormProps) => {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    jobId: preselectedJobId || "",
    providerId: preselectedProviderId || "",
    type: "",
    description: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserJobs();
    fetchAllProviders();
    if (preselectedJobId) {
      fetchJobProvider(preselectedJobId);
    }
  }, [preselectedJobId]);

  const fetchUserJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, created_at')
      .eq('posted_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      return;
    }

    setJobs(data || []);
  };

  const fetchAllProviders = async () => {
    const { data, error } = await supabase
      .from('provider_profiles')
      .select('user_id, full_name')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching providers:', error);
      return;
    }

    setProviders(data || []);
  };

  const fetchJobProvider = async (jobId: string) => {
    const { data, error } = await supabase
      .from('jobs')
      .select('assigned_provider_id')
      .eq('id', jobId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching job provider:', error);
      return;
    }

    if (data?.assigned_provider_id) {
      setFormData(prev => ({ ...prev, providerId: data.assigned_provider_id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with schema
    const validation = complaintSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to file a complaint",
        variant: "destructive",
      });
      return;
    }

    // Check rate limit
    const rateLimitCheck = await checkRateLimit('complaint_submission');
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Rate Limit Exceeded",
        description: rateLimitCheck.message || "You've submitted too many complaints. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('complaints')
      .insert({
        created_by: user.id,
        job_id: formData.jobId || null,
        provider_id: formData.providerId || null,
        type: formData.type,
        description: formData.description.trim(),
        status: 'Pending',
      });

    setLoading(false);

    if (error) {
      console.error('Error submitting complaint:', error);
      toast({
        title: "Error",
        description: "Failed to submit complaint. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Your complaint has been submitted and is under review.",
    });

    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/homeowner-dashboard');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>File a Complaint</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Complaint Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select complaint type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Provider Issue">Provider Issue</SelectItem>
                <SelectItem value="Job Issue">Job Issue</SelectItem>
                <SelectItem value="Payment Issue">Payment Issue</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobId">Related Job (Optional)</Label>
            <Select
              value={formData.jobId}
              onValueChange={(value) => {
                setFormData({ ...formData, jobId: value });
                fetchJobProvider(value);
              }}
              disabled={!!preselectedJobId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="providerId">Provider Name *</Label>
            <Select
              value={formData.providerId}
              onValueChange={(value) => setFormData({ ...formData, providerId: value })}
              disabled={!!preselectedProviderId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.user_id} value={provider.user_id}>
                    {provider.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please describe your complaint in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Complaint
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
