import { Place, SortCriteria } from '../types';

/**
 * Calculates a composite "Best Overall" journey utility score for a place.
 * Places that are AHEAD with high rating and low deviation score the highest!
 */
export function calculateJourneyUtilityScore(place: Place): number {
  if (!place) return 0;

  // Base rating score (0 - 50 points)
  const ratingScore = (place.rating ?? 0) * 10;

  // Direction penalty/bonus
  // AHEAD gets +40 points, ON_ROUTE gets +25 points, BEHIND gets -30 points
  let directionScore = 0;
  if (place.direction === 'AHEAD') {
    directionScore = 40;
  } else if (place.direction === 'ON_ROUTE') {
    directionScore = 25 - ((place.routeDeviation ?? 0) * 5);
  } else {
    directionScore = -30; // Strongly penalize going backwards
  }

  // Proximity bonus (shorter travel time = higher score, up to 25 points)
  const timeScore = Math.max(0, 25 - (place.travelTime ?? 5) * 2);

  // Status bonus (Open places favored)
  const statusScore = place.status === 'OPEN' ? 15 : -50;

  return ratingScore + directionScore + timeScore + statusScore;
}

/**
 * Sorts a list of places based on the selected criteria
 */
export function sortPlaces(places: Place[], criteria: SortCriteria): Place[] {
  if (!Array.isArray(places)) return [];
  const sorted = places.filter(Boolean);

  switch (criteria) {
    case 'NEAREST':
      return sorted.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

    case 'HIGHEST_RATED':
      return sorted.sort((a, b) => {
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (ratingDiff !== 0) {
          return ratingDiff;
        }
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      });

    case 'SHORTEST_TIME':
      return sorted.sort((a, b) => (a.travelTime ?? 0) - (b.travelTime ?? 0));

    case 'BEST_OVERALL':
    default:
      return sorted.sort((a, b) => {
        const scoreA = calculateJourneyUtilityScore(a);
        const scoreB = calculateJourneyUtilityScore(b);
        return scoreB - scoreA;
      });
  }
}
