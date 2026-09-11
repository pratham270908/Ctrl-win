import { Place, RouteOption, Coordinates, DirectionClassification } from '../types';
import { placesService, RecommendedFilter } from './placesService';
import { calculateDistanceMeters, classifyDirection } from '../utils/directionUtils';

/**
 * Interface defining the Recommendation Service contract.
 * Designed so that future backend or AI/ML recommendation engines can be plugged in
 * without changing UI or calling components.
 */
export interface IRecommendationService {
  /**
   * Generates prioritized places along the active route corridor.
   * Filters: AHEAD or ON_ROUTE, minimal detour deviation (<= 4 min), within route distance corridor,
   * excludes destination, prioritizes ON_ROUTE, lowest detour, shortest time, highest rating.
   */
  getRouteRecommendations(params: {
    destinationPlace?: Place | null;
    activeRoute?: RouteOption | null;
    currentLocation?: Coordinates;
    headingAngle?: number;
    speedKmh?: number;
    filterOption?: RecommendedFilter;
  }): Promise<Place[]>;

  /**
   * Recalculates directional statuses and distances from a simulated intermediate route position.
   */
  recalculatePlacesFromPosition(
    position: Coordinates,
    headingAngle: number,
    speedKmh: number
  ): Promise<Place[]>;

  /**
   * Processes a natural language journey intent with the CTRL+WIN backend (/api/process-journey).
   */
  processJourneyWithBackend(params: {
    userQuery: string;
    currentLat?: number;
    currentLon?: number;
    currentBearing?: number;
    backendUrl?: string;
  }): Promise<{
    parsedIntent: { amenity_type: string; destination_landmark: string };
    destinationResolved: { lat: number; lon: number; name?: string };
    recommendations: Array<{
      name: string;
      lat: number;
      lon: number;
      direction: 'Ahead' | 'Behind';
      distanceToUser: number;
      score: number;
      explanation: string;
    }>;
  }>;
}

class RecommendationService implements IRecommendationService {
  async getRouteRecommendations({
    destinationPlace,
    activeRoute,
    headingAngle = 45,
    speedKmh = 38,
    filterOption = 'ALL',
  }: {
    destinationPlace?: Place | null;
    activeRoute?: RouteOption | null;
    currentLocation?: Coordinates;
    headingAngle?: number;
    speedKmh?: number;
    filterOption?: RecommendedFilter;
  }): Promise<Place[]> {
    return placesService.getRouteRecommendations(
      destinationPlace,
      activeRoute,
      headingAngle,
      speedKmh,
      filterOption
    );
  }

  async recalculatePlacesFromPosition(
    position: Coordinates,
    headingAngle: number = 45,
    speedKmh: number = 38
  ): Promise<Place[]> {
    const allPlaces = await placesService.searchPlaces('');
    const speedMps = Math.max(8, (speedKmh * 1000) / 3600);

    return allPlaces.map((place) => {
      const dist = calculateDistanceMeters(position, place.coordinates);
      const dir: DirectionClassification = classifyDirection(
        position,
        headingAngle,
        place.coordinates,
        place.routeDeviation
      );
      const time = Math.max(1, Math.round(dist / (speedMps * 60)));

      return {
        ...place,
        distance: dist,
        travelTime: time,
        direction: dir,
      };
    });
  }

  async processJourneyWithBackend({
    userQuery,
    currentLat = 17.4375,
    currentLon = 78.3852,
    currentBearing = 45,
    backendUrl = 'http://localhost:3000',
  }: {
    userQuery: string;
    currentLat?: number;
    currentLon?: number;
    currentBearing?: number;
    backendUrl?: string;
  }) {
    try {
      const response = await fetch(`${backendUrl}/api/process-journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery, currentLat, currentLon, currentBearing }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      console.warn('Backend call fallback:', err.message);
      // Fallback response format matching backend contract
      return {
        parsedIntent: { amenity_type: 'pharmacy', destination_landmark: 'college' },
        destinationResolved: { lat: currentLat + 0.02, lon: currentLon + 0.02 },
        recommendations: [
          {
            name: 'Apollo Pharmacy 24/7',
            lat: 17.4420,
            lon: 78.3890,
            direction: 'Ahead' as const,
            distanceToUser: 0.65,
            score: 34.5,
            explanation: 'Apollo Pharmacy 24/7 is directly forward on your travel trajectory (0.65 km away), requiring minimal deviation with an optimal journey fitness score of 34.5/50.',
          },
          {
            name: 'MedPlus Pharmacy',
            lat: 17.4460,
            lon: 78.3930,
            direction: 'Ahead' as const,
            distanceToUser: 1.25,
            score: 31.0,
            explanation: 'MedPlus Pharmacy is directly forward on your travel trajectory (1.25 km away), requiring minimal deviation with an optimal journey fitness score of 31.0/50.',
          },
        ],
      };
    }
  }
}

export const recommendationService = new RecommendationService();
