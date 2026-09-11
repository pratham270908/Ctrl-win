import { Place, PlaceCategory, SortCriteria } from '../types';
import { MOCK_PLACES } from '../data/mockPlaces';
import { sortPlaces } from '../utils/sortingUtils';

export interface GroupedPlacesResult {
  ahead: Place[];
  onRoute: Place[];
  behind: Place[];
  totalCount: number;
}

class PlacesService {
  private places: Place[] = [...MOCK_PLACES];

  /**
   * Fetches top recommended places for the home screen dashboard
   * Prioritizes places AHEAD of user with top ratings
   */
  async getRecommendedPlaces(): Promise<Place[]> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    // Filter places that are AHEAD or ON_ROUTE and OPEN
    const candidates = this.places.filter(
      (p) => (p.direction === 'AHEAD' || p.direction === 'ON_ROUTE') && p.status === 'OPEN'
    );
    return sortPlaces(candidates, 'BEST_OVERALL').slice(0, 5);
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
