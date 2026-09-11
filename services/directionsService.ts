import { RouteOption, Coordinates } from '../types';
import { MOCK_ROUTE_OPTIONS, MOCK_TRANSIT_ROUTES, PublicTransitRoute } from '../data/mockRoutes';
import { API_CONFIG } from '../constants/apiConfig';
import { decodePolyline } from '../utils/polylineUtils';
import { APP_CONFIG } from '../constants/config';

/**
 * Generates a deterministic multi-point polyline between two coordinates.
 * Uses a fixed intermediate waypoint offset per routeIndex so different
 * route variants have visually distinct paths. No randomness — same inputs
 * always produce the same output.
 */
function generateFallbackPolyline(
  origin: Coordinates,
  destination: Coordinates,
  routeIndex: number = 0
): Coordinates[] {
  const points: Coordinates[] = [];
  const steps = 12; // enough resolution for a visible curved path

  // Each route variant curves through a slightly different corridor
  // offsets are fixed constants, not random
  const latOffsets = [0.003, -0.002, 0.001];
  const lngOffsets = [0.004, 0.005, -0.003];
  const midLatOffset = latOffsets[routeIndex % latOffsets.length];
  const midLngOffset = lngOffsets[routeIndex % lngOffsets.length];

  // Quadratic bezier curve: origin → midpoint → destination
  const midLat = (origin.latitude + destination.latitude) / 2 + midLatOffset;
  const midLng = (origin.longitude + destination.longitude) / 2 + midLngOffset;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const oneMinusT = 1 - t;
    // Quadratic bezier formula
    const lat = oneMinusT * oneMinusT * origin.latitude + 2 * oneMinusT * t * midLat + t * t * destination.latitude;
    const lng = oneMinusT * oneMinusT * origin.longitude + 2 * oneMinusT * t * midLng + t * t * destination.longitude;
    points.push({ latitude: lat, longitude: lng });
  }

  return points;
}

export interface TurnInstruction {
  id: string;
  instruction: string;
  distanceText: string;
  icon: string; // Ionicons name
  streetName: string;
  isDestination?: boolean;
}

/**
 * Interface defining the Directions & Routing Service contract.
 */
export interface IDirectionsService {
  getRouteOptions(origin?: Coordinates, destination?: Coordinates): Promise<RouteOption[]>;
  getTurnByTurnInstructions(): Promise<TurnInstruction[]>;
  getPublicTransitRoutes(): Promise<PublicTransitRoute[]>;
  getActiveRoutePolyline(): Coordinates[];
  setActiveRouteById(routeId: string): Coordinates[];
  getRoutePolylineById(routeId: string): Coordinates[] | undefined;
}

function getManeuverIcon(maneuver?: string): string {
  if (!maneuver) return 'arrow-up';
  const m = maneuver.toUpperCase();
  if (m.includes('LEFT')) return 'arrow-back-outline';
  if (m.includes('RIGHT')) return 'arrow-forward-outline';
  if (m.includes('UTURN')) return 'return-up-back';
  if (m.includes('RAMP') || m.includes('FORK')) return 'git-branch-outline';
  if (m.includes('ROUNDABOUT')) return 'sync-outline';
  if (m.includes('DEPART') || m.includes('STRAIGHT')) return 'arrow-up';
  return 'navigate-outline';
}

class DirectionsService implements IDirectionsService {
  private activePolyline: Coordinates[] = [];
  private liveInstructions: TurnInstruction[] = [];
  // Stores polylines keyed by route ID so variant switching updates the displayed path
  private routePolylines: Map<string, Coordinates[]> = new Map();
  // Last origin/destination used for fallback generation
  private lastOrigin: Coordinates | null = null;
  private lastDestination: Coordinates | null = null;

  /**
   * Retrieves available route options for destination.
   * Calls Google Routes API (New) when configured, with graceful fallback to mock routes.
   */
  async getRouteOptions(
    origin?: Coordinates,
    destination?: Coordinates
  ): Promise<RouteOption[]> {
    const originCoords = origin || {
      latitude: APP_CONFIG.defaultLocation.latitude,
      longitude: APP_CONFIG.defaultLocation.longitude,
    };
    const destCoords = destination || {
      latitude: APP_CONFIG.defaultDestination.latitude,
      longitude: APP_CONFIG.defaultDestination.longitude,
    };

    // 1. Try Mapbox Directions API if key configured
    if (API_CONFIG.hasMapboxApi()) {
      try {
        const mbUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.longitude},${originCoords.latitude};${destCoords.longitude},${destCoords.latitude}?alternatives=true&geometries=polyline&overview=full&steps=true&access_token=${API_CONFIG.mapboxApiKey}`;
        const response = await fetch(mbUrl);

        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.routes) && data.routes.length > 0) {
            this.routePolylines.clear();
            const parsedRoutes: RouteOption[] = data.routes.map((route: any, index: number) => {
              const minutes = Math.max(1, Math.round(route.duration / 60));
              const distKm = Math.round((route.distance / 1000) * 10) / 10;
              const routeId = `route-mb-${index + 1}`;
              const decodedCoords = route.geometry ? decodePolyline(route.geometry) : [];

              this.routePolylines.set(routeId, decodedCoords);
              if (index === 0) {
                this.activePolyline = decodedCoords;
              }

              if (index === 0 && route.legs?.[0]?.steps) {
                this.liveInstructions = route.legs[0].steps.map((step: any, stepIdx: number) => {
                  const rawInst = step.maneuver?.instruction || step.name || 'Continue straight';
                  const dist = Math.round(step.distance || 50);
                  const distText = dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${dist} m`;

                  return {
                    id: `turn-mb-${stepIdx + 1}`,
                    instruction: rawInst,
                    distanceText: distText,
                    icon: getManeuverIcon(`${step.maneuver?.type || ''} ${step.maneuver?.modifier || ''}`),
                    streetName: step.name || 'Corridor Road',
                    isDestination: stepIdx === route.legs[0].steps.length - 1,
                  };
                });
              }

              const type =
                index === 0 ? 'FASTEST' : index === 1 ? 'LOWEST_DEVIATION' : 'BEST_OVERALL';
              const title =
                index === 0
                  ? 'Fastest Route (Mapbox Live)'
                  : index === 1
                  ? 'Alternative Corridor Route'
                  : 'Best Overall Journey Fit';

              const summaryText = route.legs?.[0]?.summary || '';
              return {
                id: routeId,
                type,
                title,
                subtitle: summaryText ? `Via ${summaryText}` : 'Optimal navigation path',
                estimatedMinutes: minutes,
                distanceKm: distKm,
                trafficLevel: index === 0 ? 'LOW' : 'MODERATE',
                highlights: [
                  'Mapbox real-world road geometry',
                  'Live turn-by-turn guidance',
                  'Vector route precision',
                ],
                stopsCount: index,
                coordinates: decodedCoords,
              };
            });

            return parsedRoutes;
          }
        }
      } catch (err) {
        console.warn('Mapbox Directions API notice (using fallback):', err);
      }
    }

    // 2. Try Google Routes API if key configured
    if (API_CONFIG.hasDirectionsApi()) {
      try {
        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_CONFIG.directionsApiKey,
            'X-Goog-FieldMask':
              'routes.duration,routes.distanceMeters,routes.description,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration',
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: {
                  latitude: originCoords.latitude,
                  longitude: originCoords.longitude,
                },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: destCoords.latitude,
                  longitude: destCoords.longitude,
                },
              },
            },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            languageCode: 'en-US',
            computeAlternativeRoutes: true,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.routes) && data.routes.length > 0) {
            this.routePolylines.clear();
            const parsedRoutes: RouteOption[] = data.routes.map((route: any, index: number) => {
              const seconds = parseInt((route.duration || '600s').replace('s', ''), 10) || 600;
              const minutes = Math.max(1, Math.round(seconds / 60));
              const distKm = Math.round(((route.distanceMeters || 2000) / 1000) * 10) / 10;
              const routeId = `route-live-${index + 1}`;
              const decodedCoords = route.polyline?.encodedPolyline
                ? decodePolyline(route.polyline.encodedPolyline)
                : [];

              this.routePolylines.set(routeId, decodedCoords);
              if (index === 0) {
                this.activePolyline = decodedCoords;
              }

              // Extract turn-by-turn instructions from first route
              if (index === 0 && route.legs?.[0]?.steps) {
                this.liveInstructions = route.legs[0].steps.map((step: any, stepIdx: number) => {
                  const rawInst = step.navigationInstruction?.instructions || 'Continue straight';
                  const cleanInst = rawInst.replace(/\n/g, ' ');
                  const dist = step.distanceMeters ?? 100;
                  const distText = dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${dist} m`;

                  return {
                    id: `turn-live-${stepIdx + 1}`,
                    instruction: cleanInst,
                    distanceText: distText,
                    icon: getManeuverIcon(step.navigationInstruction?.maneuver),
                    streetName: rawInst.split('\n')[0] || 'Corridor Road',
                    isDestination: stepIdx === route.legs[0].steps.length - 1,
                  };
                });
              }

              const type =
                index === 0 ? 'FASTEST' : index === 1 ? 'LOWEST_DEVIATION' : 'BEST_OVERALL';
              const title =
                index === 0
                  ? 'Fastest Route (Live Traffic)'
                  : index === 1
                  ? 'Alternative Avenue Route'
                  : 'Scenic Corridor';

              return {
                id: routeId,
                type,
                title,
                subtitle: route.description ? `Via ${route.description}` : 'Optimal via current traffic',
                estimatedMinutes: minutes,
                distanceKm: distKm,
                trafficLevel: index === 0 ? 'LOW' : 'MODERATE',
                highlights: [
                  'Live traffic calibrated',
                  'Real road geometry',
                  'Turn-by-turn guidance available',
                ],
                stopsCount: index,
                coordinates: decodedCoords,
              };
            });

            return parsedRoutes;
          }
        }
      } catch (err) {
        // Fallback gracefully on network error or quota limits
      }
    }

    // Default prototype fallback — generate deterministic polylines per variant
    this.lastOrigin = originCoords;
    this.lastDestination = destCoords;
    this.routePolylines.clear();
    const resultRoutes: RouteOption[] = MOCK_ROUTE_OPTIONS.map((route, index) => {
      const fallbackCoords = generateFallbackPolyline(originCoords, destCoords, index);
      this.routePolylines.set(route.id, fallbackCoords);
      if (index === 0) {
        this.activePolyline = fallbackCoords;
      }
      return {
        ...route,
        coordinates: fallbackCoords,
      };
    });

    return resultRoutes;
  }

  /**
   * Switches the active polyline to the given route variant.
   * Call this when the user selects a different route card.
   */
  setActiveRouteById(routeId: string): Coordinates[] {
    const poly = this.routePolylines.get(routeId);
    if (poly && poly.length > 0) {
      this.activePolyline = poly;
      return [...poly];
    }
    return [...this.activePolyline];
  }

  /**
   * Returns polyline for a specific route variant if available.
   */
  getRoutePolylineById(routeId: string): Coordinates[] | undefined {
    return this.routePolylines.get(routeId);
  }

  /**
   * Retrieves turn-by-turn navigation instructions for active navigation.
   * Returns live Google steps if available, or rich prototype steps.
   */
  async getTurnByTurnInstructions(): Promise<TurnInstruction[]> {
    if (this.liveInstructions.length > 0) {
      return [...this.liveInstructions];
    }

    return [
      {
        id: 'turn-1',
        instruction: 'Continue straight on Mindspace Flyover',
        distanceText: '250 m',
        icon: 'arrow-up',
        streetName: 'Cyber Towers Flyover',
      },
      {
        id: 'turn-2',
        instruction: 'Turn slight right toward Expressway',
        distanceText: '600 m',
        icon: 'arrow-forward-outline',
        streetName: 'Mindspace Loop',
      },
      {
        id: 'turn-3',
        instruction: 'Take the exit toward Knowledge City',
        distanceText: '1.1 km',
        icon: 'navigate-outline',
        streetName: 'Inorbit Promenade Road',
      },
      {
        id: 'turn-4',
        instruction: 'Turn left into Campus Gate',
        distanceText: '200 m',
        icon: 'arrow-back-outline',
        streetName: 'Tech Campus Lane 4',
        isDestination: true,
      },
    ];
  }

  /**
   * Returns decoded coordinates along active route polyline
   */
  getActiveRoutePolyline(): Coordinates[] {
    return [...this.activePolyline];
  }

  /**
   * Retrieves public transit schedules
   */
  async getPublicTransitRoutes(): Promise<PublicTransitRoute[]> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return [...MOCK_TRANSIT_ROUTES];
  }
}

export const directionsService = new DirectionsService();
