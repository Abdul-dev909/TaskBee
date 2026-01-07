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

      navigator.geolocation.getCurrentPosition(
        (position) => {
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
        },
        (error) => {
          let errorMessage = "Failed to get location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location access.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
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
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
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
