import { Coordinates, DirectionClassification } from '../types';

/**
 * Converts degrees to radians
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converts radians to degrees
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates Great-Circle distance between two points in meters (Haversine formula)
 */
export function calculateDistanceMeters(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = toRadians(point1.latitude);
  const φ2 = toRadians(point2.latitude);
  const Δφ = toRadians(point2.latitude - point1.latitude);
  const Δλ = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Calculates initial bearing from point1 to point2 in degrees (0 = North, 90 = East, 180 = South, 270 = West)
 */
export function calculateBearing(
  point1: Coordinates,
  point2: Coordinates
): number {
  const y = Math.sin(toRadians(point2.longitude - point1.longitude)) * Math.cos(toRadians(point2.latitude));
  const x =
    Math.cos(toRadians(point1.latitude)) * Math.sin(toRadians(point2.latitude)) -
    Math.sin(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.cos(toRadians(point2.longitude - point1.longitude));
  const θ = Math.atan2(y, x);
  return (toDegrees(θ) + 360) % 360;
}

/**
 * Calculates angular difference between two bearings (-180 to +180)
 */
export function angleDifference(bearing1: number, bearing2: number): number {
  let diff = (bearing2 - bearing1 + 180) % 360 - 180;
  if (diff < -180) diff += 360;
  return diff;
}

/**
 * Classifies a place relative to user's current location, heading, and route corridor.
 * - AHEAD: Located in the forward cone (within ~45 degrees of heading)
 * - ON_ROUTE: Within moderate angle or minimal deviation (< 2 min deviation) along the corridor
 * - BEHIND: Angle > 90 degrees (requires turning around / going back)
 */
export function classifyDirection(
  userLocation: Coordinates,
  userHeading: number,
  placeLocation: Coordinates,
  routeDeviationMinutes: number = 0
): DirectionClassification {
  const bearingToPlace = calculateBearing(userLocation, placeLocation);
  const diffAngle = Math.abs(angleDifference(userHeading, bearingToPlace));

  // If place requires turning back (more than 90 degrees away from travel direction)
  if (diffAngle > 95) {
    return 'BEHIND';
  }

  // If place is in directly forward cone and low deviation
  if (diffAngle <= 45 && routeDeviationMinutes <= 1) {
    return 'AHEAD';
  }

  // If place is along the route corridor with slight deviation
  if (routeDeviationMinutes <= 2.5) {
    return 'ON_ROUTE';
  }

  return 'AHEAD';
}

/**
 * Human readable label for direction classification
 */
export function getDirectionLabel(direction: DirectionClassification): string {
  switch (direction) {
    case 'AHEAD':
      return 'Ahead of You';
    case 'ON_ROUTE':
      return 'On Your Route';
    case 'BEHIND':
      return 'Behind You';
  }
}

/**
 * Directional badge color & badge description
 */
export function getDirectionBadgeInfo(
  direction: DirectionClassification,
  routeDeviation: number = 0
): { label: string; sublabel: string; color: string; bgColor: string; icon: string } {
  switch (direction) {
    case 'AHEAD':
      return {
        label: 'AHEAD',
        sublabel: 'Directly on your forward path',
        color: '#10B981',
        bgColor: '#ECFDF5',
        icon: 'arrow-up',
      };
    case 'ON_ROUTE':
      return {
        label: 'ON ROUTE',
        sublabel: routeDeviation > 0 ? `+${routeDeviation} min deviation` : 'Direct along route',
        color: '#3B82F6',
        bgColor: '#EFF6FF',
        icon: 'navigate',
      };
    case 'BEHIND':
      return {
        label: 'BEHIND',
        sublabel: 'Requires turning back',
        color: '#F59E0B',
        bgColor: '#FFFBEB',
        icon: 'return-up-back',
      };
  }
}
