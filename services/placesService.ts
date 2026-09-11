import { Place, PlaceCategory, SortCriteria, Coordinates, RouteOption } from '../types';
import { MOCK_PLACES } from '../data/mockPlaces';
import { sortPlaces } from '../utils/sortingUtils';
import { classifyDirection, calculateDistanceMeters } from '../utils/directionUtils';
import { APP_CONFIG } from '../constants/config';

export interface GroupedPlacesResult {
  ahead: Place[];
  onRoute: Place[];
  behind: Place[];
  totalCount: number;
}

export type RecommendedFilter = 'ALL' | 'AHEAD_ONLY' | 'OPEN_NOW' | 'TOP_RATED' | 'UNDER_1KM';

/**
 * Interface defining the Places Service contract.
 * Allows swapping mock/prototype data with Google Places API without rewriting application components.
 */
export interface IPlacesService {
  getPlacesForHeading(headingAngle?: number, speedKmh?: number): Place[];
  getRecommendedPlaces(headingAngle?: number, speedKmh?: number, filterOption?: RecommendedFilter): Promise<Place[]>;
  getRouteRecommendations(destinationPlace?: Place | null, activeRoute?: RouteOption | null, headingAngle?: number, speedKmh?: number, filterOption?: RecommendedFilter): Promise<Place[]>;
  getPlacesByCategory(category: PlaceCategory, sortCriteria?: SortCriteria): Promise<Place[]>;
  searchPlaces(query: string, sortCriteria?: SortCriteria): Promise<Place[]>;
  getGroupedResults(categoryOrQuery: string, sortCriteria?: SortCriteria): Promise<GroupedPlacesResult>;
  getPlaceById(id: string): Promise<Place | null>;
  getEmergencyPlaces(): Promise<Place[]>;
}

class PlacesService implements IPlacesService {
  private places: Place[] = [...MOCK_PLACES];

  /**
   * Dynamically recalculates direction (AHEAD, ON_ROUTE, BEHIND) and travel time
   * for all places based on the user's active travel vector angle and speed.
   */
  getPlacesForHeading(headingAngle: number = 45, speedKmh: number = 38): Place[] {
    const userLocation = APP_CONFIG.defaultLocation;
    return this.places.map((place) => {
      const liveDist = calculateDistanceMeters(userLocation, place.coordinates);
      const liveDirection = classifyDirection(
        userLocation,
        headingAngle,
        place.coordinates,
        place.routeDeviation
      );
      // Realistic driving travel time in minutes based on active speed
      const speedMps = Math.max(8, (speedKmh * 1000) / 3600);
      const liveTime = Math.max(1, Math.round(liveDist / (speedMps * 60)));

      return {
        ...place,
        distance: liveDist,
        travelTime: liveTime,
        direction: liveDirection,
      };
    });
  }

  /**
   * Fetches recommended places for the home screen dashboard with dynamic heading & filter support
   */
  async getRecommendedPlaces(
    headingAngle: number = 45,
    speedKmh: number = 38,
    filterOption: RecommendedFilter = 'ALL'
  ): Promise<Place[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const all = this.getPlacesForHeading(headingAngle, speedKmh);
    let candidates = all;

    if (filterOption === 'AHEAD_ONLY') {
      candidates = all.filter((p) => p.direction === 'AHEAD');
    } else if (filterOption === 'OPEN_NOW') {
      candidates = all.filter((p) => p.status === 'OPEN');
    } else if (filterOption === 'TOP_RATED') {
      candidates = all.filter((p) => p.rating >= 4.5);
    } else if (filterOption === 'UNDER_1KM') {
      candidates = all.filter((p) => p.distance <= 1000);
    } else {
      // Default: AHEAD and ON_ROUTE
      candidates = all.filter(
        (p) => (p.direction === 'AHEAD' || p.direction === 'ON_ROUTE') && p.status === 'OPEN'
      );
    }

    return sortPlaces(candidates, 'BEST_OVERALL').slice(0, 6);
  }

  /**
   * Fetches smart recommendations strictly along/ahead of an active route to a destination.
   * Analyzes forward direction, on/near active route, minimal deviation, distance, travel time, rating, and open status.
   */
  async getRouteRecommendations(
    destinationPlace?: Place | null,
    activeRoute?: RouteOption | null,
    headingAngle: number = 45,
    speedKmh: number = 38,
    filterOption: RecommendedFilter = 'ALL'
  ): Promise<Place[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const all = this.getPlacesForHeading(headingAngle, speedKmh);

    // Corridor buffer based on destination distance
    const maxDistanceMeters = destinationPlace
      ? Math.max(2500, destinationPlace.distance + 1000)
      : activeRoute
      ? activeRoute.distanceKm * 1000 + 800
      : 3500;

    let candidates = all.filter((p) => {
      // Exclude destination place itself
      if (destinationPlace && p.id === destinationPlace.id) return false;

      // Must be along forward travel path (AHEAD or ON_ROUTE)
      const isForward = p.direction === 'AHEAD' || p.direction === 'ON_ROUTE';
      if (!isForward) return false;

      // Minimal deviation: within 4 minutes detour from active path
      const minimalDeviation = p.routeDeviation <= 4;
      if (!minimalDeviation) return false;

      // Within distance corridor of active trip
      const withinCorridor = p.distance <= maxDistanceMeters;
      return withinCorridor;
    });

    if (filterOption === 'AHEAD_ONLY') {
      candidates = candidates.filter((p) => p.direction === 'AHEAD');
    } else if (filterOption === 'OPEN_NOW') {
      candidates = candidates.filter((p) => p.status === 'OPEN');
    } else if (filterOption === 'TOP_RATED') {
      candidates = candidates.filter((p) => p.rating >= 4.5);
    } else if (filterOption === 'UNDER_1KM') {
      candidates = candidates.filter((p) => p.distance <= 1000);
    }

    // Sort prioritizing ON_ROUTE places, lowest route deviation, quickest travel time, and top ratings
    return candidates.sort((a, b) => {
      if (a.direction === 'ON_ROUTE' && b.direction !== 'ON_ROUTE') return -1;
      if (b.direction === 'ON_ROUTE' && a.direction !== 'ON_ROUTE') return 1;
      if (a.routeDeviation !== b.routeDeviation) return a.routeDeviation - b.routeDeviation;
      if (a.travelTime !== b.travelTime) return a.travelTime - b.travelTime;
      return b.rating - a.rating;
    }).slice(0, 6);
  }

  /**
   * Retrieves places by category with optional sorting
   */
  async getPlacesByCategory(
    category: PlaceCategory,
    sortCriteria: SortCriteria = 'BEST_OVERALL'
  ): Promise<Place[]> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const filtered = this.places.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
    return sortPlaces(filtered, sortCriteria);
  }

  /**
   * Searches places by text query across name, category, address, and description
   */
  async searchPlaces(
    query: string,
    sortCriteria: SortCriteria = 'BEST_OVERALL'
  ): Promise<Place[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matched = this.places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.services.some((s) => s.toLowerCase().includes(q))
    );

    return sortPlaces(matched, sortCriteria);
  }

  /**
   * Retrieves places grouped strictly into AHEAD, ON_ROUTE, and BEHIND categories
   * based on the underlying directional algorithm
   */
  async getGroupedResults(
    categoryOrQuery: string,
    sortCriteria: SortCriteria = 'BEST_OVERALL'
  ): Promise<GroupedPlacesResult> {
    const q = categoryOrQuery.trim().toLowerCase();
    let matched = this.places.filter(
      (p) =>
        p.category.toLowerCase() === q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
    );

    if (matched.length === 0) {
      // Fallback to all places if no exact match, for preview
      matched = this.places;
    }

    const sorted = sortPlaces(matched, sortCriteria);

    const ahead = sorted.filter((p) => p.direction === 'AHEAD');
    const onRoute = sorted.filter((p) => p.direction === 'ON_ROUTE');
    const behind = sorted.filter((p) => p.direction === 'BEHIND');

    return {
      ahead,
      onRoute,
      behind,
      totalCount: matched.length,
    };
  }

  /**
   * Retrieves single place details by ID
   */
  async getPlaceById(id: string): Promise<Place | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const found = this.places.find((p) => p.id === id);
    return found ? { ...found } : null;
  }

  /**
   * Retrieves emergency locations (Hospitals, Trauma Centers, 24/7 Pharmacies)
   */
  async getEmergencyPlaces(): Promise<Place[]> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const emergencyList = this.places.filter(
      (p) => p.category === 'Hospital' || p.isEmergency === true
    );
    return sortPlaces(emergencyList, 'NEAREST');
  }

  /**
   * Retrieves places ahead along journey for live route display
   */
  async getPlacesAlongRoute(): Promise<Place[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return this.places
      .filter((p) => p.direction === 'AHEAD' && p.status === 'OPEN')
      .slice(0, 4);
  }
}

export const placesService = new PlacesService();
