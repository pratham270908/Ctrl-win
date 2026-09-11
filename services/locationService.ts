import { UserLocation, Coordinates } from '../types';
import { APP_CONFIG } from '../constants/config';

/**
 * Interface defining the Location Service contract.
 * Ready to be swapped with `expo-location` GPS tracking in production.
 */
export interface ILocationService {
  getCurrentLocation(): Promise<UserLocation>;
  updateSimulatedLocation(updates: Partial<UserLocation>): void;
  getHeadingDescription(): string;
  getCoordinates(): Coordinates;
}

class LocationService implements ILocationService {
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
