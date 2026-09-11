import { Place, PlaceCategory, SortCriteria, Coordinates, RouteOption } from '../types';
import { MOCK_PLACES } from '../data/mockPlaces';
import { sortPlaces } from '../utils/sortingUtils';
import {
  classifyDirection,
  calculateDistanceMeters,
  calculateBearing,
  angleDifference,
  getDirectionLabel,
} from '../utils/directionUtils';
import { APP_CONFIG } from '../constants/config';
import { API_CONFIG } from '../constants/apiConfig';
import { locationService } from './locationService';

export interface GroupedPlacesResult {
  ahead: Place[];
  onRoute: Place[];
  behind: Place[];
  totalCount: number;
}

export type RecommendedFilter = 'ALL' | 'AHEAD_ONLY' | 'OPEN_NOW' | 'TOP_RATED' | 'UNDER_1KM';

export interface IPlacesService {
  getPlacesForHeading(headingAngle?: number, speedKmh?: number, originCoords?: Coordinates): Place[];
  getRecommendedPlaces(
    headingAngle?: number,
    speedKmh?: number,
    filterOption?: RecommendedFilter,
    originCoords?: Coordinates
  ): Promise<Place[]>;
  getRouteRecommendations(
    destinationPlace?: Place | null,
    activeRoute?: RouteOption | null,
    headingAngle?: number,
    speedKmh?: number,
    filterOption?: RecommendedFilter,
    originCoords?: Coordinates
  ): Promise<Place[]>;
  getPlacesByCategory(
    category: PlaceCategory,
    sortCriteria?: SortCriteria,
    originCoords?: Coordinates
  ): Promise<Place[]>;
  searchPlaces(
    query: string,
    sortCriteria?: SortCriteria,
    originCoords?: Coordinates
  ): Promise<Place[]>;
  getGroupedResults(
    categoryOrQuery: string,
    sortCriteria?: SortCriteria,
    originCoords?: Coordinates
  ): Promise<GroupedPlacesResult>;
  getPlaceById(id: string): Promise<Place | null>;
  getEmergencyPlaces(): Promise<Place[]>;
}

const CATEGORY_TO_GOOGLE_TYPES: Record<PlaceCategory, string[]> = {
  Coffee: ['coffee_shop', 'cafe'],
  Petrol: ['gas_station'],
  ATM: ['atm', 'bank'],
  Pharmacy: ['pharmacy', 'drugstore'],
  Restaurant: ['restaurant', 'fast_food_restaurant', 'meal_takeaway'],
  Hospital: ['hospital', 'medical_clinic'],
  Shopping: ['shopping_mall', 'supermarket', 'department_store', 'store'],
};

class PlacesService implements IPlacesService {
  private places: Place[] = [...MOCK_PLACES];
  private fetchedCategoryCache: Map<string, Place[]> = new Map();

  /**
   * Maps a raw Google Places API (New) item to our application Place interface
   */
  private mapGooglePlace(
    gPlace: any,
    category: PlaceCategory,
    userLocation: Coordinates,
    headingAngle: number,
    speedKmh: number
  ): Place {
    const coords: Coordinates = {
      latitude: gPlace.location?.latitude ?? userLocation.latitude,
      longitude: gPlace.location?.longitude ?? userLocation.longitude,
    };

    const liveDist = calculateDistanceMeters(userLocation, coords);
    const bearing = calculateBearing(userLocation, coords);
    const diffAngle = Math.abs(angleDifference(headingAngle, bearing));

    // Dynamic deviation based on angular offset and corridor distance
    const routeDeviation = Math.max(0, Math.min(5, Math.round((diffAngle / 45) * 2)));
    const liveDirection = classifyDirection(userLocation, headingAngle, coords, routeDeviation);

    const speedMps = Math.max(8, (speedKmh * 1000) / 3600);
    const liveTime = Math.max(1, Math.round(liveDist / (speedMps * 60)));

    const isOpen = gPlace.currentOpeningHours?.openNow ?? true;

    return {
      id: gPlace.id || `google-${Math.random().toString(36).substring(2, 9)}`,
      name: gPlace.displayName?.text || 'Nearby Place',
      category,
      rating: typeof gPlace.rating === 'number' ? gPlace.rating : 4.3,
      reviewCount: typeof gPlace.userRatingCount === 'number' ? gPlace.userRatingCount : 180,
      distance: liveDist,
      travelTime: liveTime,
      status: isOpen ? 'OPEN' : 'CLOSED',
      hours: isOpen ? 'Open Now' : 'Closed',
      coordinates: coords,
      direction: liveDirection,
      routeDeviation,
      address: gPlace.formattedAddress || 'Nearby Road, Hyderabad',
      description: `${gPlace.displayName?.text || 'Place'} located ${getDirectionLabel(
        liveDirection
      ).toLowerCase()} on your route corridor.`,
      phone: gPlace.nationalPhoneNumber || '+91 40 2345 6789',
      services: [category, 'Takeaway available', 'Digital payment'],
      isEmergency: category === 'Hospital' || category === 'Pharmacy',
    };
  }

  /**
   * Fetches real nearby places from Google Places API (New)
   */
  private async fetchGoogleNearby(
    category: PlaceCategory,
    userLocation: Coordinates,
    headingAngle: number,
    speedKmh: number
  ): Promise<Place[] | null> {
    if (!API_CONFIG.hasPlacesApi()) return null;

    try {
      const types = CATEGORY_TO_GOOGLE_TYPES[category] || ['point_of_interest'];
      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_CONFIG.placesApiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.primaryType,places.types,places.nationalPhoneNumber',
        },
        body: JSON.stringify({
          includedTypes: types,
          maxResultCount: 10,
          locationRestriction: {
            circle: {
              center: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              },
              radius: 4000.0,
            },
          },
          languageCode: 'en',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.places) && data.places.length > 0) {
          return data.places.map((p: any) =>
            this.mapGooglePlace(p, category, userLocation, headingAngle, speedKmh)
          );
        }
      }
    } catch {
      // Fall back gracefully
    }

    return null;
  }

  /**
   * Fetches real text search places from Google Places API (New)
   */
  private async fetchGoogleTextSearch(
    query: string,
    userLocation: Coordinates,
    headingAngle: number,
    speedKmh: number
  ): Promise<Place[] | null> {
    if (!API_CONFIG.hasPlacesApi()) return null;

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_CONFIG.placesApiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.primaryType,places.types,places.nationalPhoneNumber',
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: 10,
          locationBias: {
            circle: {
              center: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              },
              radius: 5000.0,
            },
          },
          languageCode: 'en',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.places) && data.places.length > 0) {
          return data.places.map((p: any) => {
            // Infer category from primaryType
            const pType = (p.primaryType || '').toLowerCase();
            let cat: PlaceCategory = 'Restaurant';
            if (pType.includes('cafe') || pType.includes('coffee')) cat = 'Coffee';
            else if (pType.includes('gas') || pType.includes('fuel')) cat = 'Petrol';
            else if (pType.includes('atm') || pType.includes('bank')) cat = 'ATM';
            else if (pType.includes('pharmacy')) cat = 'Pharmacy';
            else if (pType.includes('hospital')) cat = 'Hospital';
            else if (pType.includes('store') || pType.includes('mall')) cat = 'Shopping';

            return this.mapGooglePlace(p, cat, userLocation, headingAngle, speedKmh);
          });
        }
      }
    } catch {
      // Fall back gracefully
    }

    return null;
  }

  /**
   * Dynamically recalculates direction (AHEAD, ON_ROUTE, BEHIND) and travel time
   * for all places based on the user's active travel vector angle and speed.
   */
  getPlacesForHeading(
    headingAngle: number = 45,
    speedKmh: number = 38,
    originCoords?: Coordinates
  ): Place[] {
    const userLocation = originCoords || locationService.getCoordinates();
    return this.places.map((place) => {
      const liveDist = calculateDistanceMeters(userLocation, place.coordinates);
      const liveDirection = classifyDirection(
        userLocation,
        headingAngle,
        place.coordinates,
        place.routeDeviation
      );
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
    filterOption: RecommendedFilter = 'ALL',
    originCoords?: Coordinates
  ): Promise<Place[]> {
    const all = this.getPlacesForHeading(headingAngle, speedKmh, originCoords);
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
      candidates = all.filter(
        (p) => (p.direction === 'AHEAD' || p.direction === 'ON_ROUTE') && p.status === 'OPEN'
      );
    }

    return sortPlaces(candidates, 'BEST_OVERALL').slice(0, 6);
  }

  /**
   * Fetches smart recommendations strictly along/ahead of an active route to a destination.
   */
  async getRouteRecommendations(
    destinationPlace?: Place | null,
    activeRoute?: RouteOption | null,
    headingAngle: number = 45,
    speedKmh: number = 38,
    filterOption: RecommendedFilter = 'ALL',
    originCoords?: Coordinates
  ): Promise<Place[]> {
    const all = this.getPlacesForHeading(headingAngle, speedKmh, originCoords);

    const maxDistanceMeters = destinationPlace
      ? Math.max(2500, destinationPlace.distance + 1000)
      : activeRoute
      ? activeRoute.distanceKm * 1000 + 800
      : 3500;

    let candidates = all.filter((p) => {
      if (destinationPlace && p.id === destinationPlace.id) return false;
      const isForward = p.direction === 'AHEAD' || p.direction === 'ON_ROUTE';
      if (!isForward) return false;
      const minimalDeviation = p.routeDeviation <= 4;
      if (!minimalDeviation) return false;
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

    return candidates
      .sort((a, b) => {
        if (a.direction === 'ON_ROUTE' && b.direction !== 'ON_ROUTE') return -1;
        if (b.direction === 'ON_ROUTE' && a.direction !== 'ON_ROUTE') return 1;
        if (a.routeDeviation !== b.routeDeviation) return a.routeDeviation - b.routeDeviation;
        if (a.travelTime !== b.travelTime) return a.travelTime - b.travelTime;
        return b.rating - a.rating;
      })
      .slice(0, 6);
  }

  /**
   * Retrieves places by category with optional sorting.
   * Connects to Google Places API (New) with fallback to prototype places.
   */
  async getPlacesByCategory(
    category: PlaceCategory,
    sortCriteria: SortCriteria = 'BEST_OVERALL',
    originCoords?: Coordinates
  ): Promise<Place[]> {
    const userLocation = originCoords || locationService.getCoordinates();
    const cacheKey = `${category}_${userLocation.latitude.toFixed(2)}_${userLocation.longitude.toFixed(2)}`;

    // Check cache or fetch real Google Places
    if (this.fetchedCategoryCache.has(cacheKey)) {
      const cached = this.fetchedCategoryCache.get(cacheKey)!;
      return sortPlaces(cached, sortCriteria);
    }

    const realPlaces = await this.fetchGoogleNearby(category, userLocation, 45, 38);
    if (realPlaces && realPlaces.length > 0) {
      this.fetchedCategoryCache.set(cacheKey, realPlaces);
      // Merge into master list for seamless lookup by id
      realPlaces.forEach((rp) => {
        if (!this.places.some((p) => p.id === rp.id)) {
          this.places.unshift(rp);
        }
      });
      return sortPlaces(realPlaces, sortCriteria);
    }

    // Prototype fallback recomputed with user location
    const filtered = this.places
      .filter((p) => p.category.toLowerCase() === category.toLowerCase())
      .map((p) => {
        const liveDist = calculateDistanceMeters(userLocation, p.coordinates);
        const liveDirection = classifyDirection(userLocation, 45, p.coordinates, p.routeDeviation);
        return { ...p, distance: liveDist, direction: liveDirection };
      });
    return sortPlaces(filtered, sortCriteria);
  }

  /**
   * Searches places by text query across name, category, address, and description.
   * Connects to Google Places API (New) text search with prototype fallback.
   */
  async searchPlaces(
    query: string,
    sortCriteria: SortCriteria = 'BEST_OVERALL',
    originCoords?: Coordinates
  ): Promise<Place[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const userLocation = originCoords || locationService.getCoordinates();

    // Try Google Places Text Search
    const realResults = await this.fetchGoogleTextSearch(query, userLocation, 45, 38);
    if (realResults && realResults.length > 0) {
      realResults.forEach((rp) => {
        if (!this.places.some((p) => p.id === rp.id)) {
          this.places.unshift(rp);
        }
      });
      return sortPlaces(realResults, sortCriteria);
    }

    // Prototype fallback recomputed with user location
    const matched = this.places
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.services.some((s) => s.toLowerCase().includes(q))
      )
      .map((p) => {
        const liveDist = calculateDistanceMeters(userLocation, p.coordinates);
        const liveDirection = classifyDirection(userLocation, 45, p.coordinates, p.routeDeviation);
        return { ...p, distance: liveDist, direction: liveDirection };
      });

    return sortPlaces(matched, sortCriteria);
  }

  /**
   * Retrieves places grouped strictly into AHEAD, ON_ROUTE, and BEHIND categories
   */
  async getGroupedResults(
    categoryOrQuery: string,
    sortCriteria: SortCriteria = 'BEST_OVERALL',
    originCoords?: Coordinates
  ): Promise<GroupedPlacesResult> {
    const q = categoryOrQuery.trim();

    // Check if query directly matches a known category
    const knownCategories: PlaceCategory[] = [
      'Coffee',
      'Petrol',
      'ATM',
      'Pharmacy',
      'Restaurant',
      'Hospital',
      'Shopping',
    ];
    const matchedCategory = knownCategories.find(
      (c) => c.toLowerCase() === q.toLowerCase()
    );

    let placesList: Place[];
    if (matchedCategory) {
      placesList = await this.getPlacesByCategory(matchedCategory, sortCriteria, originCoords);
    } else {
      placesList = await this.searchPlaces(q, sortCriteria, originCoords);
      if (placesList.length === 0) {
        placesList = this.getPlacesForHeading(45, 38, originCoords);
      }
    }

    const sorted = sortPlaces(placesList, sortCriteria);
    const ahead = sorted.filter((p) => p.direction === 'AHEAD');
    const onRoute = sorted.filter((p) => p.direction === 'ON_ROUTE');
    const behind = sorted.filter((p) => p.direction === 'BEHIND');

    return {
      ahead,
      onRoute,
      behind,
      totalCount: sorted.length,
    };
  }

  /**
   * Retrieves single place details by ID
   */
  async getPlaceById(id: string): Promise<Place | null> {
    const found = this.places.find((p) => p.id === id);
    if (found) return { ...found };
    return null;
  }

  /**
   * Retrieves emergency locations (Hospitals, Trauma Centers, 24/7 Pharmacies)
   */
  async getEmergencyPlaces(): Promise<Place[]> {
    const hospitals = await this.getPlacesByCategory('Hospital', 'NEAREST');
    if (hospitals.length > 0) return hospitals;

    const emergencyList = this.places.filter(
      (p) => p.category === 'Hospital' || p.isEmergency === true
    );
    return sortPlaces(emergencyList, 'NEAREST');
  }

  /**
   * Retrieves places ahead along journey for live route display
   */
  async getPlacesAlongRoute(): Promise<Place[]> {
    const all = this.getPlacesForHeading(45, 38);
    return all.filter((p) => p.direction === 'AHEAD' && p.status === 'OPEN').slice(0, 4);
  }
}

export const placesService = new PlacesService();
