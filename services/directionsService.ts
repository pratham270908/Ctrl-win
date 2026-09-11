import { RouteOption, Coordinates } from '../types';
import { MOCK_ROUTE_OPTIONS, MOCK_TRANSIT_ROUTES, PublicTransitRoute } from '../data/mockRoutes';
import { APP_CONFIG } from '../constants/config';

export interface TurnInstruction {
  id: string;
  instruction: string;
  distanceText: string;
  icon: string; // Ionicons name
  streetName: string;
  isDestination?: boolean;
}

class DirectionsService {
  /**
   * Retrieves available route options for destination
   */
  async getRouteOptions(
    _origin?: Coordinates,
    _destination?: Coordinates
  ): Promise<RouteOption[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return [...MOCK_ROUTE_OPTIONS];
  }

  /**
   * Retrieves turn-by-turn navigation instructions for active navigation
   */
  async getTurnByTurnInstructions(): Promise<TurnInstruction[]> {
    return [
      {
        id: 'turn-1',
        instruction: 'Continue straight',
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
   * Retrieves public transit schedules
   */
  async getPublicTransitRoutes(): Promise<PublicTransitRoute[]> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return [...MOCK_TRANSIT_ROUTES];
  }
}

export const directionsService = new DirectionsService();
