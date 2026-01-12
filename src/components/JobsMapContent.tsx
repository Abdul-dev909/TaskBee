import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, DollarSign, Calendar, Navigation, Loader2, Save } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  onLocationUpdate?: (lat: number, lng: number) => void;
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

// Popup content component - styled for map popup
function JobPopupContent({ job, distance, onJobClick }: { job: Job; distance: string | null; onJobClick: (id: string) => void }) {
  return (
    <div className="min-w-[220px] p-1">
      {/* Category Badge */}
      <div className="flex items-center justify-between mb-2">
        <span 
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}
        >
          {job.category}
        </span>
        {job.budget && (
          <span className="text-sm font-bold" style={{ color: '#22c55e' }}>
            Rs. {job.budget}
          </span>
        )}
      </div>
      
      {/* Title */}
      <h3 className="font-bold text-base mb-2" style={{ color: '#1f2937' }}>
        {job.title}
      </h3>
      
      {/* Details */}
      <div className="space-y-1.5 text-sm mb-3" style={{ color: '#6b7280' }}>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
          <span>{job.city}</span>
          {distance && (
            <span 
              className="px-1.5 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' }}
            >
              {distance} km away
            </span>
          )}
        </div>
        {job.date_time && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
            <span>{new Date(job.date_time).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      
      {/* Action Button */}
      <button
        onClick={() => onJobClick(job.id)}
        className="w-full py-2 px-4 rounded-lg text-sm font-semibold text-white transition-all"
        style={{ 
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
        }}
      >
        View & Apply →
      </button>
    </div>
  );
}

export default function JobsMapContent({ jobs, providerLocation, onJobClick, onLocationUpdate }: JobsMapContentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);

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

  // Custom icon for user's current location
  const userLocationIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Save location to provider profile
  const handleSaveLocation = useCallback(async () => {
    if (!currentUserLocation) return;
    
    setIsSavingLocation(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to save your location");
        return;
      }

      const { error } = await supabase
        .from("provider_profiles")
        .update({
          latitude: currentUserLocation.lat,
          longitude: currentUserLocation.lng,
        })
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error saving location:", error);
        toast.error("Failed to save location");
      } else {
        toast.success("Location saved to your profile!");
        onLocationUpdate?.(currentUserLocation.lat, currentUserLocation.lng);
      }
    } catch (err) {
      toast.error("Failed to save location");
    } finally {
      setIsSavingLocation(false);
    }
  }, [currentUserLocation, onLocationUpdate]);

  // Locate Me function
  const handleLocateMe = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setIsLocating(true);

    const successCallback = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      
      console.log("Location obtained:", { latitude, longitude, accuracy });
      
      // Remove existing user location marker
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
      }

      // Add new marker at user's location
      const marker = L.marker([latitude, longitude], { icon: userLocationIcon })
        .addTo(map)
        .bindPopup(`<strong>You are here</strong><br/><small>Accuracy: ~${Math.round(accuracy)}m</small>`);
      
      userLocationMarkerRef.current = marker;
      setCurrentUserLocation({ lat: latitude, lng: longitude });

      // Center map on user's location with animation
      map.flyTo([latitude, longitude], 14, { duration: 1 });
      
      toast.success(`Location found! (Accuracy: ~${Math.round(accuracy)}m)`);
      setIsLocating(false);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error.code, error.message);
      setIsLocating(false);
      
      if (error.code === error.TIMEOUT) {
        // Retry with lower accuracy
        toast.info("Trying with lower accuracy...");
        navigator.geolocation.getCurrentPosition(
          successCallback,
          (retryError) => {
            console.error("Retry failed:", retryError);
            toast.error("Could not get your location. Please check location settings and try again.");
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
      } else if (error.code === error.PERMISSION_DENIED) {
        toast.error("Location permission denied. Please enable location access in your browser settings.");
      } else {
        toast.error("Could not get your location. Please try again or set location manually in Settings.");
      }
    };

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0, // Force fresh location
    });
  }, [userLocationIcon]);

  // Jobs without location
  const jobsWithoutLocation = jobs.filter(
    (job) => job.latitude === null || job.longitude === null
  );

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainerRef}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      />
      
      {/* Map Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="shadow-lg bg-background/95 backdrop-blur-sm hover:bg-background"
          onClick={handleLocateMe}
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2" />
          )}
          {isLocating ? "Locating..." : "Locate Me"}
        </Button>
        
        {currentUserLocation && (
          <Button
            variant="default"
            size="sm"
            className="shadow-lg"
            onClick={handleSaveLocation}
            disabled={isSavingLocation}
          >
            {isSavingLocation ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Location
          </Button>
        )}
      </div>

      {/* Jobs without location notice */}
      {jobsWithoutLocation.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-background/95 backdrop-blur-sm p-2 rounded-lg border shadow-lg max-h-24 overflow-auto">
          <p className="text-xs text-muted-foreground mb-1">
            {jobsWithoutLocation.length} job(s) not shown on map (no coordinates):
          </p>
          <div className="flex flex-wrap gap-1">
            {jobsWithoutLocation.slice(0, 5).map((job) => (
              <Button
                key={job.id}
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => onJobClick(job.id)}
              >
                {job.title.substring(0, 20)}...
              </Button>
            ))}
            {jobsWithoutLocation.length > 5 && (
              <span className="text-xs text-muted-foreground self-center">
                +{jobsWithoutLocation.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
