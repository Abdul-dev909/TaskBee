import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeolocationState {
  coordinates: Coordinates | null;
  loading: boolean;
  error: string | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    loading: false,
    error: null,
  });

  const getCurrentLocation = useCallback((): Promise<Coordinates | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const error = "Geolocation is not supported by your browser";
        setState(prev => ({ ...prev, error, loading: false }));
        toast({
          title: "Location Not Supported",
          description: error,
          variant: "destructive",
        });
        resolve(null);
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      const successCallback = (position: GeolocationPosition) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setState({
          coordinates: coords,
          loading: false,
          error: null,
        });
        toast({
          title: "Location Captured",
          description: "Your current location has been detected",
        });
        resolve(coords);
      };

      const handleError = (error: GeolocationPositionError) => {
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        setState({
          coordinates: null,
          loading: false,
          error: errorMessage,
        });
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
        resolve(null);
      };

      // Try with high accuracy first
      navigator.geolocation.getCurrentPosition(
        successCallback,
        (error) => {
          // On timeout or unavailable, retry with lower accuracy (network-based)
          if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
            console.log("High accuracy location failed, trying with lower accuracy...");
            navigator.geolocation.getCurrentPosition(
              successCallback,
              handleError,
              {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 600000, // Allow cached location up to 10 minutes
              }
            );
          } else {
            handleError(error);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 30000, // 30 seconds for GPS
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    });
  }, []);

  const clearLocation = useCallback(() => {
    setState({
      coordinates: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    getCurrentLocation,
    clearLocation,
  };
};
