import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, DollarSign, Calendar, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icons
const jobIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const providerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
}

// Component to recenter map
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function JobsMap({ jobs, providerLocation, onJobClick }: JobsMapProps) {
  const navigate = useNavigate();
  const [mapCenter, setMapCenter] = useState<[number, number]>([31.5204, 74.3587]); // Default: Lahore
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Filter jobs with valid coordinates
  const jobsWithLocation = jobs.filter(
    (job) => job.latitude !== null && job.longitude !== null
  );

  // Jobs without location
  const jobsWithoutLocation = jobs.filter(
    (job) => job.latitude === null || job.longitude === null
  );

  useEffect(() => {
    if (providerLocation?.latitude && providerLocation?.longitude) {
      setMapCenter([providerLocation.latitude, providerLocation.longitude]);
    } else if (jobsWithLocation.length > 0) {
      setMapCenter([jobsWithLocation[0].latitude!, jobsWithLocation[0].longitude!]);
    }
  }, [providerLocation, jobsWithLocation]);

  const handleViewJob = (jobId: string) => {
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
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {providerLocation?.latitude && providerLocation?.longitude && (
              <>
                <RecenterMap lat={providerLocation.latitude} lng={providerLocation.longitude} />
                <Marker
                  position={[providerLocation.latitude, providerLocation.longitude]}
                  icon={providerIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <strong>Your Location</strong>
                      <br />
                      <span className="text-sm text-muted-foreground">
                        Service radius: {providerLocation.service_radius_km} km
                      </span>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[providerLocation.latitude, providerLocation.longitude]}
                  radius={providerLocation.service_radius_km * 1000}
                  pathOptions={{
                    color: "hsl(142, 71%, 45%)",
                    fillColor: "hsl(142, 71%, 45%)",
                    fillOpacity: 0.1,
                  }}
                />
              </>
            )}

            {jobsWithLocation.map((job) => {
              const distance = providerLocation?.latitude && providerLocation?.longitude
                ? calculateDistance(
                    providerLocation.latitude,
                    providerLocation.longitude,
                    job.latitude!,
                    job.longitude!
                  ).toFixed(1)
                : null;

              return (
                <Marker
                  key={job.id}
                  position={[job.latitude!, job.longitude!]}
                  icon={jobIcon}
                  eventHandlers={{
                    click: () => setSelectedJob(job),
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-semibold text-base mb-1">{job.title}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {job.category}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.city}
                          {distance && ` (${distance} km)`}
                        </div>
                        {job.budget && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {job.budget}
                          </div>
                        )}
                        {job.date_time && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(job.date_time).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleViewJob(job.id)}
                      >
                        View & Apply
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
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
