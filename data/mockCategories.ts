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
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.16)',
    description: 'Cafes, espresso bars and drive-thrus ahead',
  },
  {
    id: 'Petrol',
    name: 'Petrol',
    iconName: 'gas-station',
    emoji: '⛽',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.16)',
    description: 'Fuel pumps, EV chargers and air stations',
  },
  {
    id: 'ATM',
    name: 'ATM',
    iconName: 'atm',
    emoji: '🏧',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.16)',
    description: 'Cash dispensers and bank kiosks',
  },
  {
    id: 'Pharmacy',
    name: 'Pharmacy',
    iconName: 'pill',
    emoji: '💊',
    color: '#F43F5E',
    bgColor: 'rgba(244, 63, 94, 0.16)',
    description: '24/7 medical stores and chemist shops',
  },
  {
    id: 'Restaurant',
    name: 'Food',
    iconName: 'silverware-fork-knife',
    emoji: '🍽',
    color: '#FB923C',
    bgColor: 'rgba(251, 146, 60, 0.16)',
    description: 'Quick bites, fine dining and takeaway',
  },
  {
    id: 'Hospital',
    name: 'Hospital',
    iconName: 'hospital-building',
    emoji: '🏥',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.16)',
    description: 'Emergency trauma, clinics and care centers',
  },
  {
    id: 'Shopping',
    name: 'Shopping',
    iconName: 'cart',
    emoji: '🛍',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.16)',
    description: 'Supermarkets, malls and convenience',
  },
];
