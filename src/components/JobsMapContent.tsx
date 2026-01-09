import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, DollarSign, Calendar } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { createRoot } from "react-dom/client";

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

export interface JobsMapContentProps {
  jobs: Job[];
  providerLocation: ProviderLocation | null;
  onJobClick: (jobId: string) => void;
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

// Popup content component
function JobPopupContent({ job, distance, onJobClick }: { job: Job; distance: string | null; onJobClick: (id: string) => void }) {
  return (
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
  );
}

export default function JobsMapContent({ jobs, providerLocation, onJobClick }: JobsMapContentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Filter jobs with valid coordinates
  const jobsWithLocation = jobs.filter(
    (job) => job.latitude !== null && job.longitude !== null
  );

  // Calculate initial center
  const getInitialCenter = (): [number, number] => {
    if (providerLocation?.latitude && providerLocation?.longitude) {
      return [providerLocation.latitude, providerLocation.longitude];
    }
    if (jobsWithLocation.length > 0) {
      return [jobsWithLocation[0].latitude!, jobsWithLocation[0].longitude!];
    }
    return [31.5204, 74.3587]; // Default: Lahore
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: getInitialCenter(),
      zoom: 12,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;
    setIsReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setIsReady(false);
    };
  }, []);

  // Update markers and circle when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isReady) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Clear existing circle
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    // Add provider location marker and circle
    if (providerLocation?.latitude && providerLocation?.longitude) {
      const providerMarker = L.marker(
        [providerLocation.latitude, providerLocation.longitude],
        { icon: providerIcon }
      ).addTo(map);

      providerMarker.bindPopup(`
        <div style="text-align: center;">
          <strong>Your Location</strong>
          <br />
          <span style="font-size: 0.875rem; color: #6b7280;">
            Service radius: ${providerLocation.service_radius_km} km
          </span>
        </div>
      `);

      markersRef.current.push(providerMarker);

      // Add service radius circle
      const circle = L.circle([providerLocation.latitude, providerLocation.longitude], {
        radius: providerLocation.service_radius_km * 1000,
        color: "#22c55e",
        fillColor: "#22c55e",
        fillOpacity: 0.1,
      }).addTo(map);

      circleRef.current = circle;

      // Center map on provider location
      map.setView([providerLocation.latitude, providerLocation.longitude], 12);
    }

    // Add job markers
    jobsWithLocation.forEach((job) => {
      const distance = providerLocation?.latitude && providerLocation?.longitude
        ? calculateDistance(
            providerLocation.latitude,
            providerLocation.longitude,
            job.latitude!,
            job.longitude!
          ).toFixed(1)
        : null;

      const marker = L.marker([job.latitude!, job.longitude!], { icon: jobIcon }).addTo(map);

      // Create popup content
      const popupContainer = document.createElement("div");
      const root = createRoot(popupContainer);
      root.render(
        <JobPopupContent job={job} distance={distance} onJobClick={onJobClick} />
      );

      marker.bindPopup(popupContainer);
      markersRef.current.push(marker);
    });
  }, [jobs, providerLocation, onJobClick, isReady, jobsWithLocation]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    />
  );
}
