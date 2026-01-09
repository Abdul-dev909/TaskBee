import { useEffect, useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, DollarSign, Calendar } from "lucide-react";

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

export interface JobsMapContentProps {
  jobs: Job[];
  providerLocation: ProviderLocation | null;
  onJobClick: (jobId: string) => void;
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

function JobsMapContent({ jobs, providerLocation, onJobClick }: JobsMapContentProps) {
  const [MapComponents, setMapComponents] = useState<any>(null);
  const [L, setL] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([31.5204, 74.3587]); // Default: Lahore

  // Filter jobs with valid coordinates
  const jobsWithLocation = jobs.filter(
    (job) => job.latitude !== null && job.longitude !== null
  );

  // Dynamically import react-leaflet and leaflet
  useEffect(() => {
    let mounted = true;
    
    Promise.all([
      import("react-leaflet"),
      import("leaflet")
    ]).then(([reactLeaflet, leaflet]) => {
      if (!mounted) return;
      
      // Fix for default marker icons in Leaflet with Vite
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      
      setL(leaflet.default);
      setMapComponents(reactLeaflet);
    });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (providerLocation?.latitude && providerLocation?.longitude) {
      setMapCenter([providerLocation.latitude, providerLocation.longitude]);
    } else if (jobsWithLocation.length > 0) {
      setMapCenter([jobsWithLocation[0].latitude!, jobsWithLocation[0].longitude!]);
    }
  }, [providerLocation, jobsWithLocation.length]);

  if (!MapComponents || !L) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <span className="text-sm text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Circle } = MapComponents;

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

  return (
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
          <Marker
            position={[providerLocation.latitude, providerLocation.longitude]}
            icon={providerIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
                <br />
                <span className="text-sm text-gray-600">
                  Service radius: {providerLocation.service_radius_km} km
                </span>
              </div>
            </Popup>
          </Marker>
          <Circle
            center={[providerLocation.latitude, providerLocation.longitude]}
            radius={providerLocation.service_radius_km * 1000}
            pathOptions={{
              color: "#22c55e",
              fillColor: "#22c55e",
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
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-base mb-1">{job.title}</h3>
                <div className="space-y-1 text-sm text-gray-600 mb-2">
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
                  onClick={() => onJobClick(job.id)}
                >
                  View & Apply
                </Button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default memo(JobsMapContent);
