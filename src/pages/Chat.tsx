import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Chat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("job");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        setCurrentUser(user);

        if (!jobId) {
          toast.error("Invalid chat session");
          navigate(-1);
          return;
        }

        // Get job details
        const { data: job, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .single();

        if (jobError || !job) {
          toast.error("Job not found");
          navigate(-1);
          return;
        }

        // Check if user is authorized (job owner or assigned provider)
        if (job.posted_by !== user.id && job.assigned_provider_id !== user.id) {
          toast.error("You are not authorized to access this chat");
          navigate(-1);
          return;
        }

        // Check if job has assigned provider
        if (!job.assigned_provider_id) {
          toast.error("No provider assigned to this job yet");
          navigate(-1);
          return;
        }

        setJobDetails(job);

        // Determine other user
        const otherUserId = job.posted_by === user.id 
          ? job.assigned_provider_id 
          : job.posted_by;

        // Get other user details
        if (job.posted_by === user.id) {
          // Current user is homeowner, get provider details
          const { data: provider } = await supabase
            .from("provider_profiles")
            .select("full_name")
            .eq("user_id", otherUserId)
            .single();
          
          setOtherUser({
            id: otherUserId,
            name: provider?.full_name || "Service Provider",
          });
        } else {
          // Current user is provider, get homeowner details
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", otherUserId)
            .single();
          
          setOtherUser({
            id: otherUserId,
            name: profile?.full_name || "Homeowner",
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading chat:", error);
        toast.error("Failed to load chat");
        navigate(-1);
      }
    };

    fetchChatData();
  }, [jobId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {currentUser && jobDetails && otherUser && (
            <ChatInterface
              jobId={jobId!}
              currentUserId={currentUser.id}
              otherUserId={otherUser.id}
              otherUserName={otherUser.name}
              jobTitle={jobDetails.title}
            />
          )}
        </div>
      </div>
    </div>
  );
}