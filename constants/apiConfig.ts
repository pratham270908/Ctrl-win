/**
 * API Configuration for Smart Directional Location Finder
 * Safely accesses Expo environment variables with fallbacks.
 */

export const API_CONFIG = {
  placesApiKey:
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '',
  directionsApiKey:
    process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '',
  mapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',

  hasPlacesApi(): boolean {
    return Boolean(this.placesApiKey && this.placesApiKey.trim().length > 0);
  },

  hasDirectionsApi(): boolean {
    return Boolean(this.directionsApiKey && this.directionsApiKey.trim().length > 0);
  },
};
