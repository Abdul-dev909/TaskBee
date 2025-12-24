/**
 * Custom hook for haptic feedback on mobile devices
 * Uses the Vibration API when available
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const vibrationPatterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  warning: [30, 30, 30],
  error: [50, 100, 50],
};

export const useHaptic = () => {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const vibrate = (style: HapticStyle = 'light') => {
    if (!isSupported) return false;
    
    try {
      const pattern = vibrationPatterns[style];
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  };

  const lightTap = () => vibrate('light');
  const mediumTap = () => vibrate('medium');
  const heavyTap = () => vibrate('heavy');
  const success = () => vibrate('success');
  const warning = () => vibrate('warning');
  const error = () => vibrate('error');

  return {
    isSupported,
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    success,
    warning,
    error,
  };
};

// Standalone function for use outside React components
export const hapticFeedback = (style: HapticStyle = 'light') => {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return false;
  
  try {
    const pattern = vibrationPatterns[style];
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
};
