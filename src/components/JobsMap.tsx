import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  budget: string | null;
  city: string;
  date_time: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface ProviderLocation {
  latitude: number | null;
  longitude: number | null;
  service_radius_km: number;
}

interface JobsMapProps {
  jobs: Job[];
  providerLocation: ProviderLocation | null;
  onJobClick?: (jobId: string) => void;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

// Dynamically import the map component to avoid SSR issues
const JobsMapContentWrapper = ({ jobs, providerLocation, onJobClick, onLocationUpdate }: { 
  jobs: Job[]; 
  providerLocation: ProviderLocation | null; 
  onJobClick: (jobId: string) => void;
  onLocationUpdate?: (lat: number, lng: number) => void;
}) => {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Dynamic import on client side only
    import("./JobsMapContent").then((mod) => {
      setMapComponent(() => mod.default);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      </div>
    );
  }

  return <MapComponent jobs={jobs} providerLocation={providerLocation} onJobClick={onJobClick} onLocationUpdate={onLocationUpdate} />;
};

export default function JobsMap({ jobs, providerLocation, onJobClick, onLocationUpdate }: JobsMapProps) {
  const navigate = useNavigate();

  // Memoize job counts
  const { jobsWithLocation, jobsWithoutLocation } = useMemo(() => {
    const withLocation = jobs.filter(
      (job) => job.latitude !== null && job.longitude !== null
    );
    const withoutLocation = jobs.filter(
      (job) => job.latitude === null || job.longitude === null
    );
    return { jobsWithLocation: withLocation, jobsWithoutLocation: withoutLocation };
  }, [jobs]);

  const handleJobClick = (jobId: string) => {
    if (onJobClick) {
      onJobClick(jobId);
    } else {
      navigate(`/job/${jobId}`);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Jobs Near You
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!providerLocation?.latitude && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-600 dark:text-yellow-400 mb-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              <span>Set your location in Settings to see nearby jobs on the map!</span>
            </div>
          </div>
        )}

        <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: "400px" }}>
          <JobsMapContentWrapper
            jobs={jobs}
            providerLocation={providerLocation}
            onJobClick={handleJobClick}
            onLocationUpdate={onLocationUpdate}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-muted-foreground">Jobs on Map</div>
            <div className="text-xl font-semibold">{jobsWithLocation.length}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-muted-foreground">Jobs Without Location</div>
            <div className="text-xl font-semibold">{jobsWithoutLocation.length}</div>
          </div>
        </div>

        {jobsWithoutLocation.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Some jobs don't have location data and are only shown in the list view.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
