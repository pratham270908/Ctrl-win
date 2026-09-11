import { UserLocation, Coordinates } from '../types';
import { APP_CONFIG } from '../constants/config';

/**
 * Service to provide current user location, heading, and travel direction.
 * In this version, returns realistic simulated location and heading.
 * Ready to be swapped with `expo-location` GPS tracking in production.
 */
class LocationService {
  private currentLocation: UserLocation = {
    ...APP_CONFIG.defaultLocation,
  };

  /**
   * Retrieves current user coordinates, heading, and speed
   */
  async getCurrentLocation(): Promise<UserLocation> {
    // Simulate brief device sensor read delay
    await new Promise((resolve) => setTimeout(resolve, 80));
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
