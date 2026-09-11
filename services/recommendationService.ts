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
}

export const recommendationService = new RecommendationService();
