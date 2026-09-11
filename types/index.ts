export type DirectionClassification = 'AHEAD' | 'ON_ROUTE' | 'BEHIND';

export type PlaceCategory =
  | 'Coffee'
  | 'Petrol'
  | 'ATM'
  | 'Pharmacy'
  | 'Restaurant'
  | 'Hospital'
  | 'Shopping';

export type PlaceStatus = 'OPEN' | 'CLOSED';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  rating: number;
  reviewCount: number;
  distance: number; // in meters
  travelTime: number; // in minutes
  status: PlaceStatus;
  hours: string;
  coordinates: Coordinates;
  direction: DirectionClassification;
  routeDeviation: number; // in minutes deviation from current path
  address: string;
  description: string;
  phone: string;
  services: string[];
  imageUrl?: string;
  isEmergency?: boolean;
}

export interface RouteOption {
  id: string;
  type: 'FASTEST' | 'LOWEST_DEVIATION' | 'BEST_OVERALL';
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  distanceKm: number;
  trafficLevel: 'LOW' | 'MODERATE' | 'HEAVY';
  highlights: string[];
  stopsCount: number;
}

export interface JourneyPlaceAhead {
  category: PlaceCategory;
  name: string;
  distanceMeters: number;
  travelMinutes: number;
  directionLabel: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  heading: number; // 0-360 degrees, 0 = North, 45 = North-East
  headingText: string;
  speedKmh: number;
  accuracyMeters: number;
  label: string;
}

export interface UserReport {
  id: string;
  placeName: string;
  reportType: 'Wrong location' | 'Closed place' | 'Incorrect route' | 'Road blocked' | 'Other';
  description: string;
  timestamp: string;
  status: 'Received' | 'In Review' | 'Resolved';
}

export interface OfflineArea {
  id: string;
  name: string;
  sizeMb: number;
  downloaded: boolean;
  statusText: string;
  lastUpdated?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isGuest: boolean;
  savedPlacesCount: number;
  reportsCount: number;
  recentSearches: string[];
}

export interface AppSettings {
  notifications: boolean;
  locationPermissions: boolean;
  wheelchairAccessible: boolean;
  avoidStairs: boolean;
  avoidTolls: boolean;
  distanceUnit: 'km' | 'miles';
  theme: 'dark' | 'light' | 'system';
  voiceGuidance: boolean;
}

export type SortCriteria = 'NEAREST' | 'HIGHEST_RATED' | 'SHORTEST_TIME' | 'BEST_OVERALL';
