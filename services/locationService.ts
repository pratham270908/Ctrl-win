import * as Location from 'expo-location';
import { UserLocation, Coordinates } from '../types';
import { APP_CONFIG } from '../constants/config';
import { API_CONFIG } from '../constants/apiConfig';

export function getHeadingTextFromDegrees(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'North';
  if (normalized >= 22.5 && normalized < 67.5) return 'North-East';
  if (normalized >= 67.5 && normalized < 112.5) return 'East';
  if (normalized >= 112.5 && normalized < 157.5) return 'South-East';
  if (normalized >= 157.5 && normalized < 202.5) return 'South';
  if (normalized >= 202.5 && normalized < 247.5) return 'South-West';
  if (normalized >= 247.5 && normalized < 292.5) return 'West';
  return 'North-West';
}

/**
 * Interface defining the Location Service contract.
 */
export interface ILocationService {
  getCurrentLocation(): Promise<UserLocation>;
  updateSimulatedLocation(updates: Partial<UserLocation>): void;
  getHeadingDescription(): string;
  getCoordinates(): Coordinates;
  subscribe(callback: (loc: UserLocation) => void): () => void;
  startWatchingLocation(): Promise<() => void>;
  isLiveGpsActive(): boolean;
}

class LocationService implements ILocationService {
  private currentLocation: UserLocation = {
    ...APP_CONFIG.defaultLocation,
  };
  private hasRequestedPermission: boolean = false;
  private isGpsActive: boolean = false;
  private listeners: Set<(loc: UserLocation) => void> = new Set();
  private watchSubscription: Location.LocationSubscription | null = null;
  private watchCount: number = 0;

  /**
   * Subscribes a listener callback to location updates
   */
  subscribe(callback: (loc: UserLocation) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const snapshot = { ...this.currentLocation };
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        // Suppress listener callback errors
      }
    });
  }

  isLiveGpsActive(): boolean {
    return this.isGpsActive;
  }

  /**
   * Formats a reverse geocode object into a human-readable location label
   */
  private formatGeocodeLabel(rev: Location.LocationGeocodedAddress[]): string | null {
    if (!rev || rev.length === 0) return null;
    const first = rev[0];
    const parts = [
      first.street || first.name,
      first.district || first.subregion,
      first.city,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }

  /**
   * Reverse geocodes coordinates, trying native device geocoding first, then Google Geocoding API
   */
  private async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
      const formatted = this.formatGeocodeLabel(rev);
      if (formatted) return formatted;
    } catch {
      // Fall through to Google Geocoding API
    }

    if (API_CONFIG.hasGeocodingApi()) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_CONFIG.geocodingApiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const addr = data.results[0].formatted_address;
            return addr ? addr.split(',').slice(0, 2).join(', ').trim() : null;
          }
        }
      } catch {
        // Keep fallback
      }
    }

    return null;
  }

  /**
   * Starts active device GPS tracking with distance and time intervals
   */
  async startWatchingLocation(): Promise<() => void> {
    try {
      if (!this.hasRequestedPermission) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        this.hasRequestedPermission = true;
        if (status !== 'granted') {
          return () => {};
        }
      }

      this.watchCount++;

      if (!this.watchSubscription) {
        this.watchSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2500,
            distanceInterval: 4,
          },
          async (loc) => {
            if (!loc || !loc.coords) return;
            this.isGpsActive = true;

            const headingDeg =
              typeof loc.coords.heading === 'number' && loc.coords.heading >= 0
                ? Math.round(loc.coords.heading)
                : this.currentLocation.heading;

            const speed =
              typeof loc.coords.speed === 'number' && loc.coords.speed > 0
                ? Math.round(loc.coords.speed * 3.6)
                : this.currentLocation.speedKmh;

            let label = this.currentLocation.label;
            const revLabel = await this.reverseGeocode(loc.coords.latitude, loc.coords.longitude);
            if (revLabel) {
              label = revLabel;
            }

            this.currentLocation = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              heading: headingDeg,
              headingText: getHeadingTextFromDegrees(headingDeg),
              speedKmh: speed,
              accuracyMeters: Math.round(loc.coords.accuracy ?? 5),
              label,
            };

            this.notifyListeners();
          }
        );
      }

      return () => {
        this.watchCount = Math.max(0, this.watchCount - 1);
        if (this.watchCount === 0 && this.watchSubscription) {
          this.watchSubscription.remove();
          this.watchSubscription = null;
        }
      };
    } catch {
      return () => {};
    }
  }

  /**
   * Retrieves current user coordinates, heading, and speed from device GPS
   * with fallback to default prototype location.
   */
  async getCurrentLocation(): Promise<UserLocation> {
    try {
      if (!this.hasRequestedPermission) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        this.hasRequestedPermission = true;
        if (status !== 'granted') {
          return { ...this.currentLocation };
        }
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (loc && loc.coords) {
        this.isGpsActive = true;
        const headingDeg =
          typeof loc.coords.heading === 'number' && loc.coords.heading >= 0
            ? Math.round(loc.coords.heading)
            : this.currentLocation.heading;

        const speed =
          typeof loc.coords.speed === 'number' && loc.coords.speed > 0
            ? Math.round(loc.coords.speed * 3.6)
            : this.currentLocation.speedKmh;

        // Try to reverse geocode locality using native + Google geocoder
        let label = this.currentLocation.label;
        const revLabel = await this.reverseGeocode(loc.coords.latitude, loc.coords.longitude);
        if (revLabel) {
          label = revLabel;
        }

        this.currentLocation = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          heading: headingDeg,
          headingText: getHeadingTextFromDegrees(headingDeg),
          speedKmh: speed,
          accuracyMeters: Math.round(loc.coords.accuracy ?? 5),
          label,
        };

        this.notifyListeners();
      }
    } catch {
      // Graceful fallback to cached / default prototype coordinates
    }

    return { ...this.currentLocation };
  }

  /**
   * Updates simulated location/heading (used for testing or simulated route movements)
   */
  updateSimulatedLocation(updates: Partial<UserLocation>): void {
    this.currentLocation = {
      ...this.currentLocation,
      ...updates,
    };
    this.notifyListeners();
  }

  /**
   * Returns formatted heading text e.g. "Travelling North-East"
   */
  getHeadingDescription(): string {
    return `Travelling ${this.currentLocation.headingText}`;
  }

  /**
   * Returns current coordinates
   */
  getCoordinates(): Coordinates {
    return {
      latitude: this.currentLocation.latitude,
      longitude: this.currentLocation.longitude,
    };
  }
}

export const locationService = new LocationService();
