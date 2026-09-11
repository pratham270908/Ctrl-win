import { PlaceCategory } from '../types';

export interface CategoryInfo {
  id: PlaceCategory;
  name: string;
  iconName: string; // Ionicons name
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'Coffee',
    name: 'Coffee',
    iconName: 'cafe',
    emoji: '☕',
    color: '#B45309',
    bgColor: '#FEF3C7',
    description: 'Cafes, espresso bars & drive-thrus ahead',
  },
  {
    id: 'Petrol',
    name: 'Petrol',
    iconName: 'speedometer',
    emoji: '⛽',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    description: 'Fuel pumps, EV chargers & air stations',
  },
  {
    id: 'ATM',
    name: 'ATM',
    iconName: 'cash',
    emoji: '🏧',
    color: '#059669',
    bgColor: '#D1FAE5',
    description: 'Cash dispensers & bank kiosks',
  },
  {
    id: 'Pharmacy',
    name: 'Pharmacy',
    iconName: 'medkit',
    emoji: '💊',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    description: '24/7 medical stores & chemist shops',
  },
  {
    id: 'Restaurant',
    name: 'Restaurant',
    iconName: 'restaurant',
    emoji: '🍔',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    description: 'Quick bites, fine dining & takeaway',
  },
  {
    id: 'Hospital',
    name: 'Hospital',
    iconName: 'fitness',
    emoji: '🏥',
    color: '#E11D48',
    bgColor: '#FFE4E6',
    description: 'Emergency trauma, clinics & care centers',
  },
  {
    id: 'Shopping',
    name: 'Shopping',
    iconName: 'cart',
    emoji: '🛍️',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    description: 'Supermarkets, malls & convenience',
  },
];
