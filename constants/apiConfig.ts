/**
 * API Configuration for Smart Directional Location Finder
 * Safely accesses Expo environment variables with fallbacks.
 */

export const API_CONFIG = {
  placesApiKey:
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '',
  routesApiKey:
    process.env.EXPO_PUBLIC_GOOGLE_ROUTES_API_KEY ||
    process.env.GOOGLE_ROUTES_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY ||
    process.env.GOOGLE_DIRECTIONS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '',
  directionsApiKey:
    process.env.EXPO_PUBLIC_GOOGLE_ROUTES_API_KEY ||
    process.env.GOOGLE_ROUTES_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY ||
    process.env.GOOGLE_DIRECTIONS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '',
  mapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  geocodingApiKey:
    process.env.EXPO_PUBLIC_GOOGLE_GEOCODING_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '',
  mapboxApiKey:
    process.env.EXPO_PUBLIC_MAPBOX_API_KEY ||
    process.env.MAPBOX_ACCESS_TOKEN ||
    '',

  hasPlacesApi(): boolean {
    return Boolean(this.placesApiKey && this.placesApiKey.trim().length > 0);
  },

  hasRoutesApi(): boolean {
    return Boolean(this.routesApiKey && this.routesApiKey.trim().length > 0);
  },

  hasDirectionsApi(): boolean {
    return this.hasRoutesApi();
  },

  hasGeocodingApi(): boolean {
    return Boolean(this.geocodingApiKey && this.geocodingApiKey.trim().length > 0);
  },

  hasMapboxApi(): boolean {
    return Boolean(this.mapboxApiKey && this.mapboxApiKey.trim().length > 0);
  },
};
