import { Place, SortCriteria } from '../types';

/**
 * Calculates a composite "Best Overall" journey utility score for a place.
 * Places that are AHEAD with high rating and low deviation score the highest!
 */
export function calculateJourneyUtilityScore(place: Place): number {
  // Base rating score (0 - 50 points)
  const ratingScore = place.rating * 10;

  // Direction penalty/bonus
  // AHEAD gets +40 points, ON_ROUTE gets +25 points, BEHIND gets -30 points
  let directionScore = 0;
  if (place.direction === 'AHEAD') {
    directionScore = 40;
  } else if (place.direction === 'ON_ROUTE') {
    directionScore = 25 - (place.routeDeviation * 5);
  } else {
    directionScore = -30; // Strongly penalize going backwards
  }

  // Proximity bonus (shorter travel time = higher score, up to 25 points)
  const timeScore = Math.max(0, 25 - place.travelTime * 2);

  // Status bonus (Open places favored)
  const statusScore = place.status === 'OPEN' ? 15 : -50;

  return ratingScore + directionScore + timeScore + statusScore;
}

/**
 * Sorts a list of places based on the selected criteria
 */
export function sortPlaces(places: Place[], criteria: SortCriteria): Place[] {
  const sorted = [...places];

  switch (criteria) {
    case 'NEAREST':
      return sorted.sort((a, b) => a.distance - b.distance);

    case 'HIGHEST_RATED':
      return sorted.sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.reviewCount - a.reviewCount;
      });

    case 'SHORTEST_TIME':
      return sorted.sort((a, b) => a.travelTime - b.travelTime);

    case 'BEST_OVERALL':
    default:
      return sorted.sort((a, b) => {
        const scoreA = calculateJourneyUtilityScore(a);
        const scoreB = calculateJourneyUtilityScore(b);
        return scoreB - scoreA;
      });
  }
}
