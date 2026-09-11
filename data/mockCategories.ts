import { PlaceCategory } from '../types';

export interface CategoryInfo {
  id: PlaceCategory;
  name: string;
  iconName: string;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'Coffee',
    name: 'Coffee',
    iconName: 'coffee',
    emoji: '☕',
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    description: 'Cafes, espresso bars and drive-thrus ahead',
  },
  {
    id: 'Petrol',
    name: 'Petrol',
    iconName: 'gas-station',
    emoji: '⛽',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    description: 'Fuel pumps, EV chargers and air stations',
  },
  {
    id: 'ATM',
    name: 'ATM',
    iconName: 'atm',
    emoji: '🏧',
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    description: 'Cash dispensers and bank kiosks',
  },
  {
    id: 'Pharmacy',
    name: 'Pharmacy',
    iconName: 'pill',
    emoji: '💊',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    description: '24/7 medical stores and chemist shops',
  },
  {
    id: 'Restaurant',
    name: 'Food',
    iconName: 'silverware-fork-knife',
    emoji: '🍽',
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    description: 'Quick bites, fine dining and takeaway',
  },
  {
    id: 'Hospital',
    name: 'Hospital',
    iconName: 'hospital-building',
    emoji: '🏥',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    description: 'Emergency trauma, clinics and care centers',
  },
  {
    id: 'Shopping',
    name: 'Shopping',
    iconName: 'cart',
    emoji: '🛍',
    color: '#A78BFA',
    bgColor: 'rgba(167, 139, 250, 0.15)',
    description: 'Supermarkets, malls and convenience',
  },
];
