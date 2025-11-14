import { useSearchParams } from "react-router-dom";
import { ComplaintForm } from "@/components/ComplaintForm";

const FileComplaint = () => {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId') || undefined;
  const providerId = searchParams.get('providerId') || undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="container max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">File a Complaint</h1>
        <ComplaintForm 
          preselectedJobId={jobId} 
          preselectedProviderId={providerId}
        />
      </div>
    </div>
  );
};

export default FileComplaint;
