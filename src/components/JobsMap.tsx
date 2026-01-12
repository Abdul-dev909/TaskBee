import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Navigation, Loader2, Map, List, Briefcase, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          </div>
          <span className="text-sm text-muted-foreground font-medium">Loading map...</span>
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
    <div className="space-y-6">
      {/* Map Card */}
      <Card className="glass-card overflow-hidden border-2 border-primary/10 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Map className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Jobs Near You</CardTitle>
                <CardDescription>Find opportunities in your area</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="gap-1 py-1.5 px-3">
                <MapPin className="w-3 h-3" />
                {jobsWithLocation.length} on map
              </Badge>
              <Badge variant="outline" className="gap-1 py-1.5 px-3">
                <List className="w-3 h-3" />
                {jobsWithoutLocation.length} list only
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Location Warning */}
          {!providerLocation?.latitude && (
            <div className="m-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Navigation className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">Location Not Set</p>
                  <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                    Click "Locate Me" on the map or set your location in Settings to see nearby jobs!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className="relative" style={{ height: "450px" }}>
            <JobsMapContentWrapper
              jobs={jobs}
              providerLocation={providerLocation}
              onJobClick={handleJobClick}
              onLocationUpdate={onLocationUpdate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Jobs Without Location - Beautiful Cards */}
      {jobsWithoutLocation.length > 0 && (
        <Card className="glass-card border-2 border-dashed border-muted-foreground/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-muted">
                <List className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Jobs Without Map Location</CardTitle>
                <CardDescription>These jobs are available but don't have GPS coordinates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {jobsWithoutLocation.slice(0, 6).map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleJobClick(job.id)}
                  className="group p-4 rounded-xl border border-border bg-gradient-to-br from-background to-muted/30 hover:from-primary/5 hover:to-accent/10 hover:border-primary/30 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {job.title}
                    </h4>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs py-0 px-2">
                      <Briefcase className="w-2.5 h-2.5 mr-1" />
                      {job.category}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.city}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {jobsWithoutLocation.length > 6 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm" className="gap-2">
                  View all {jobsWithoutLocation.length} jobs in Browse tab
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
