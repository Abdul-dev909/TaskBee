import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, DollarSign, Calendar, Navigation, Loader2, Save, ZoomIn, Layers, Target } from "lucide-react";
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

// Category colors for better visual distinction
const categoryColors: { [key: string]: string } = {
  'Plumbing': '#3b82f6',
  'plumbing': '#3b82f6',
  'Electrical': '#f59e0b',
  'electrical': '#f59e0b',
  'Cleaning': '#10b981',
  'cleaning': '#10b981',
  'Painting': '#8b5cf6',
  'painting': '#8b5cf6',
  'AC Repair': '#ef4444',
  'Handyman': '#ec4899',
  'handyman': '#ec4899',
  'Moving': '#06b6d4',
  'moving': '#06b6d4',
  'Gardening': '#22c55e',
  'Yard Work': '#22c55e',
  'Carpentry': '#a855f7',
  'Assembly': '#a855f7',
};

// Create custom SVG marker icon
const createJobIcon = (category: string, isNearby: boolean = false) => {
  const color = categoryColors[category] || '#6366f1';
  const pulseClass = isNearby ? 'pulse-marker' : '';
  
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="40" height="50">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="${color}" filter="url(#shadow)"/>
      <circle cx="20" cy="18" r="10" fill="white"/>
      <circle cx="20" cy="18" r="6" fill="${color}"/>
    </svg>
  `;
  
  return L.divIcon({
    html: `<div class="custom-marker ${pulseClass}" style="position: relative;">${svgIcon}</div>`,
    className: 'custom-job-marker',
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -45],
  });
};

// Provider location icon with pulse effect
const createProviderIcon = () => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="25" cy="25" r="20" fill="#22c55e" opacity="0.2">
        <animate attributeName="r" from="15" to="25" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="25" cy="25" r="12" fill="#22c55e" filter="url(#glow)"/>
      <circle cx="25" cy="25" r="6" fill="white"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'provider-marker',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -15],
  });
};

// User location icon (red dot with pulse)
const createUserLocationIcon = () => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50">
      <circle cx="25" cy="25" r="20" fill="#ef4444" opacity="0.2">
        <animate attributeName="r" from="15" to="25" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="25" cy="25" r="10" fill="#ef4444"/>
      <circle cx="25" cy="25" r="4" fill="white"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'user-location-marker',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -15],
  });
};

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

// Format distance for display
function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

// Popup content component - enhanced styling
function JobPopupContent({ job, distance, isNearby, onJobClick }: { 
  job: Job; 
  distance: number | null; 
  isNearby: boolean;
  onJobClick: (id: string) => void;
}) {
  const color = categoryColors[job.category] || '#6366f1';
  
  return (
    <div className="min-w-[240px] p-2">
      {/* Header with category and budget */}
      <div className="flex items-center justify-between mb-3">
        <span 
          className="px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: `${color}15`, color: color, border: `1px solid ${color}30` }}
        >
          {job.category}
        </span>
        {isNearby && (
          <span 
            className="px-2 py-0.5 rounded-full text-xs font-medium animate-pulse"
            style={{ backgroundColor: '#22c55e20', color: '#16a34a' }}
          >
            ✓ In Range
          </span>
        )}
      </div>
      
      {/* Title */}
      <h3 className="font-bold text-base mb-2 line-clamp-2" style={{ color: '#1f2937' }}>
        {job.title}
      </h3>
      
      {/* Budget highlight */}
      {job.budget && (
        <div 
          className="flex items-center gap-2 mb-3 p-2 rounded-lg"
          style={{ backgroundColor: '#f0fdf4' }}
        >
          <DollarSign className="w-4 h-4" style={{ color: '#16a34a' }} />
          <span className="font-bold text-lg" style={{ color: '#16a34a' }}>
            Rs. {job.budget}
          </span>
        </div>
      )}
      
      {/* Details */}
      <div className="space-y-2 text-sm mb-3" style={{ color: '#6b7280' }}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#9ca3af' }} />
          <span>{job.city}</span>
          {distance !== null && (
            <span 
              className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: isNearby ? '#dcfce7' : '#fef3c7',
                color: isNearby ? '#16a34a' : '#d97706'
              }}
            >
              {formatDistance(distance)}
            </span>
          )}
        </div>
        {job.date_time && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#9ca3af' }} />
            <span>{new Date(job.date_time).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
          </div>
        )}
      </div>
      
      {/* Action Button */}
      <button
        onClick={() => onJobClick(job.id)}
        className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ 
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          boxShadow: `0 4px 12px ${color}40`
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <Briefcase className="w-4 h-4" />
          View Details & Apply
        </span>
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
  const providerMarkerRef = useRef<L.Marker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // Filter and categorize jobs
  const { jobsWithLocation, nearbyJobs, farJobs } = useMemo(() => {
    const withLocation = jobs.filter(
      (job) => job.latitude !== null && job.longitude !== null
    );
    
    if (!providerLocation?.latitude || !providerLocation?.longitude) {
      return { jobsWithLocation: withLocation, nearbyJobs: withLocation, farJobs: [] };
    }
    
    const categorized = withLocation.map(job => ({
      ...job,
      distance: calculateDistance(
        providerLocation.latitude!,
        providerLocation.longitude!,
        job.latitude!,
        job.longitude!
      )
    }));
    
    const nearby = categorized.filter(j => j.distance <= providerLocation.service_radius_km);
    const far = categorized.filter(j => j.distance > providerLocation.service_radius_km);
    
    return { 
      jobsWithLocation: withLocation, 
      nearbyJobs: nearby.sort((a, b) => a.distance - b.distance),
      farJobs: far.sort((a, b) => a.distance - b.distance)
    };
  }, [jobs, providerLocation]);

  // Calculate initial center and bounds
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
      zoomControl: false, // We'll add custom controls
    });

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Use a cleaner map style
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setIsReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setIsReady(false);
    };
  }, []);

  // Fit bounds to show all markers
  const fitBoundsToJobs = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || jobsWithLocation.length === 0) return;

    const bounds = L.latLngBounds([]);
    
    // Add provider location to bounds
    if (providerLocation?.latitude && providerLocation?.longitude) {
      bounds.extend([providerLocation.latitude, providerLocation.longitude]);
    }
    
    // Add all job locations to bounds
    jobsWithLocation.forEach(job => {
      if (job.latitude && job.longitude) {
        bounds.extend([job.latitude, job.longitude]);
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [jobsWithLocation, providerLocation]);

  // Update markers and circle when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isReady) return;

    // Clear existing job markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Clear existing circle and provider marker
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
    if (providerMarkerRef.current) {
      providerMarkerRef.current.remove();
      providerMarkerRef.current = null;
    }

    // Add provider location marker and circle
    if (providerLocation?.latitude && providerLocation?.longitude) {
      // Add service radius circle first (so it's behind markers)
      const circle = L.circle([providerLocation.latitude, providerLocation.longitude], {
        radius: providerLocation.service_radius_km * 1000,
        color: "#22c55e",
        fillColor: "#22c55e",
        fillOpacity: 0.08,
        weight: 2,
        dashArray: "10, 5",
      }).addTo(map);
      circleRef.current = circle;

      // Add provider marker
      const providerMarker = L.marker(
        [providerLocation.latitude, providerLocation.longitude],
        { icon: createProviderIcon(), zIndexOffset: 1000 }
      ).addTo(map);

      providerMarker.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <div style="font-weight: 700; font-size: 14px; color: #16a34a; margin-bottom: 4px;">
            📍 Your Location
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            Service radius: <strong>${providerLocation.service_radius_km} km</strong>
          </div>
        </div>
      `);
      providerMarkerRef.current = providerMarker;
    }

    // Add job markers
    jobsWithLocation.forEach((job) => {
      const distance = providerLocation?.latitude && providerLocation?.longitude
        ? calculateDistance(
            providerLocation.latitude,
            providerLocation.longitude,
            job.latitude!,
            job.longitude!
          )
        : null;
      
      const isNearby = distance !== null && distance <= (providerLocation?.service_radius_km || 10);

      const marker = L.marker([job.latitude!, job.longitude!], { 
        icon: createJobIcon(job.category, isNearby),
        riseOnHover: true,
      }).addTo(map);

      // Create popup content
      const popupContainer = document.createElement("div");
      const root = createRoot(popupContainer);
      root.render(
        <JobPopupContent job={job} distance={distance} isNearby={isNearby} onJobClick={onJobClick} />
      );

      marker.bindPopup(popupContainer, {
        maxWidth: 280,
        className: 'custom-popup',
      });
      markersRef.current.push(marker);
    });
  }, [jobs, providerLocation, onJobClick, isReady, jobsWithLocation]);

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
      const marker = L.marker([latitude, longitude], { 
        icon: createUserLocationIcon(),
        zIndexOffset: 2000
      })
        .addTo(map)
        .bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <div style="font-weight: 700; color: #ef4444; margin-bottom: 4px;">
              📌 Current Location
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              Accuracy: ~${Math.round(accuracy)}m
            </div>
          </div>
        `);
      
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
        toast.info("Trying with lower accuracy...");
        navigator.geolocation.getCurrentPosition(
          successCallback,
          (retryError) => {
            console.error("Retry failed:", retryError);
            toast.error("Could not get your location. Please check location settings.");
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
      } else if (error.code === error.PERMISSION_DENIED) {
        toast.error("Location permission denied. Please enable location access.");
      } else {
        toast.error("Could not get your location. Please try again.");
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
      maximumAge: 0,
    });
  }, []);

  // Get unique categories for legend
  const uniqueCategories = useMemo(() => {
    const cats = new Set(jobsWithLocation.map(j => j.category));
    return Array.from(cats);
  }, [jobsWithLocation]);

  return (
    <div className="relative h-full w-full">
      {/* Add CSS for custom markers */}
      <style>{`
        .custom-job-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          padding: 0;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .custom-popup .leaflet-popup-tip {
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        .pulse-marker {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>

      <div
        ref={mapContainerRef}
        style={{ height: "100%", width: "100%" }}
        className="z-0 rounded-lg"
      />
      
      {/* Map Controls - Top Right */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="shadow-lg bg-background/95 backdrop-blur-sm hover:bg-background border border-border/50"
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

        <Button
          variant="secondary"
          size="sm"
          className="shadow-lg bg-background/95 backdrop-blur-sm hover:bg-background border border-border/50"
          onClick={fitBoundsToJobs}
          title="Fit all jobs in view"
        >
          <Target className="w-4 h-4 mr-2" />
          Fit All
        </Button>
      </div>

      {/* Legend - Top Left */}
      <div className="absolute top-3 left-3 z-[1000]">
        <Button
          variant="secondary"
          size="sm"
          className="shadow-lg bg-background/95 backdrop-blur-sm hover:bg-background border border-border/50 mb-2"
          onClick={() => setShowLegend(!showLegend)}
        >
          <Layers className="w-4 h-4 mr-2" />
          Legend
        </Button>

        {showLegend && (
          <div className="bg-background/95 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg p-3 max-w-[200px]">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Map Legend</div>
            
            {/* Provider location */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <span className="text-xs">Your Location</span>
            </div>

            {/* Categories */}
            <div className="space-y-1.5">
              {uniqueCategories.slice(0, 6).map(cat => (
                <div key={cat} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColors[cat] || '#6366f1' }}
                  />
                  <span className="text-xs truncate">{cat}</span>
                </div>
              ))}
              {uniqueCategories.length > 6 && (
                <span className="text-xs text-muted-foreground">+{uniqueCategories.length - 6} more</span>
              )}
            </div>

            {/* Stats */}
            <div className="mt-3 pt-2 border-t border-border/50 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">In range:</span>
                <span className="font-semibold text-green-600">{nearbyJobs.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Out of range:</span>
                <span className="font-medium text-amber-600">{farJobs.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Jobs summary - Bottom */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000]">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">{nearbyJobs.length} nearby</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm text-muted-foreground">{farJobs.length} further</span>
              </div>
            </div>
            {jobsWithLocation.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Click markers for details
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
