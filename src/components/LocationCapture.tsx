import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";

interface LocationCaptureProps {
  onLocationCaptured: (latitude: number, longitude: number) => void;
  latitude?: number | null;
  longitude?: number | null;
  showRadius?: boolean;
  radius?: number;
  onRadiusChange?: (radius: number) => void;
}

export const LocationCapture = ({
  onLocationCaptured,
  latitude,
  longitude,
  showRadius = false,
  radius = 10,
  onRadiusChange,
}: LocationCaptureProps) => {
  const { loading, getCurrentLocation } = useGeolocation();

  const handleGetLocation = async () => {
    const coords = await getCurrentLocation();
    if (coords) {
      onLocationCaptured(coords.latitude, coords.longitude);
    }
  };

  const hasLocation = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={hasLocation ? "outline" : "default"}
          onClick={handleGetLocation}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Detecting...
            </>
          ) : hasLocation ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              Update Location
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              Use My Location
            </>
          )}
        </Button>

        {hasLocation && (
          <Badge variant="secondary" className="gap-1">
            <MapPin className="w-3 h-3" />
            Location captured
          </Badge>
        )}
      </div>

      {hasLocation && (
        <p className="text-xs text-muted-foreground">
          📍 Coordinates: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
        </p>
      )}

      {showRadius && onRadiusChange && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Service Radius: {radius} km</label>
          <input
            type="range"
            min="5"
            max="50"
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 km</span>
            <span>50 km</span>
          </div>
        </div>
      )}
    </div>
  );
};
