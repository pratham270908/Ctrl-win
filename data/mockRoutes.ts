import { RouteOption } from '../types';

export const MOCK_ROUTE_OPTIONS: RouteOption[] = [
  {
    id: 'route-fastest',
    type: 'FASTEST',
    title: 'Fastest Route',
    subtitle: 'Via Mindspace Expressway Flyover',
    estimatedMinutes: 8,
    distanceKm: 2.1,
    trafficLevel: 'LOW',
    highlights: ['No signal bottlenecks', 'Flyover expressway', 'Smooth traffic flow'],
    stopsCount: 0,
  },
  {
    id: 'route-deviation',
    type: 'LOWEST_DEVIATION',
    title: 'Lowest Deviation',
    subtitle: 'Direct Main Avenue corridor',
    estimatedMinutes: 10,
    distanceKm: 2.3,
    trafficLevel: 'MODERATE',
    highlights: ['Passes 4 useful places ahead', 'Wide well-lit avenues', 'Easy right exits'],
    stopsCount: 1,
  },
  {
    id: 'route-best',
    type: 'BEST_OVERALL',
    title: 'Best Overall',
    subtitle: 'Optimal time + service accessibility',
    estimatedMinutes: 9,
    distanceKm: 2.2,
    trafficLevel: 'LOW',
    highlights: ['Balanced travel time', '3 open drive-thrus on way', 'EV chargers en route'],
    stopsCount: 0,
  },
];

export interface PublicTransitRoute {
  id: string;
  type: 'BUS' | 'METRO' | 'TRAIN';
  routeNumber: string;
  destination: string;
  departureInMinutes: number;
  totalDurationMinutes: number;
  fare: string;
  frequency: string;
  stops: string[];
}

export const MOCK_TRANSIT_ROUTES: PublicTransitRoute[] = [
  {
    id: 'transit-bus-216',
    type: 'BUS',
    routeNumber: 'Bus 216',
    destination: 'City Center / Secunderabad',
    departureInMinutes: 4,
    totalDurationMinutes: 28,
    fare: '₹25',
    frequency: 'Every 8 min',
    stops: [
      'Cyber Gateway Terminal',
      'Cyber Towers (You are here)',
      'Mindspace Junction',
      'Durgam Cheruvu Gate',
      'Jubilee Hills Check Post',
      'City Center Station',
    ],
  },
  {
    id: 'transit-metro-blue',
    type: 'METRO',
    routeNumber: 'Blue Line Metro',
    destination: 'Nagole via Ameerpet Interchange',
    departureInMinutes: 3,
    totalDurationMinutes: 18,
    fare: '₹40',
    frequency: 'Every 4 min',
    stops: [
      'Raidurg Terminal',
      'Hitec City (200m ahead)',
      'Durgam Cheruvu',
      'Madhapur',
      'Peddamma Gudi',
      'Jubilee Hills',
      'Ameerpet Interchange',
    ],
  },
  {
    id: 'transit-bus-100',
    type: 'BUS',
    routeNumber: 'AC Electric Shuttle 100E',
    destination: 'Airport / Shamshabad',
    departureInMinutes: 11,
    totalDurationMinutes: 45,
    fare: '₹200',
    frequency: 'Every 20 min',
    stops: [
      'Hitec City MMTS Point',
      'Bio-Diversity Park',
      'Gachibowli Stadium',
      'ORR Tollway Entry',
      'RGIA International Terminal',
    ],
  },
];
