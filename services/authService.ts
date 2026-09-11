import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { APP_CONFIG } from '../constants/config';

const DEFAULT_USER: UserProfile = {
  id: 'usr-guest-001',
  name: 'Traveler Explorer',
  email: 'explorer@smartdirectional.app',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  isGuest: true,
  savedPlacesCount: 3,
  reportsCount: 1,
  recentSearches: ['Coffee', 'Petrol Station', 'HDFC ATM'],
};

class AuthService {
  /**
   * Loads persisted user session or null
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const json = await AsyncStorage.getItem(APP_CONFIG.storageKeys.AUTH_USER);
      if (json) {
        return JSON.parse(json);
      }
      return DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  }

  /**
   * Authenticates user locally with email and password
   */
  async login(email: string, _password: string): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 600)); // realistic feel

    const nameFromEmail = email.split('@')[0] || 'User';
    const formattedName =
      nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      name: formattedName,
      email: email.trim().toLowerCase(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      isGuest: false,
      savedPlacesCount: 4,
      reportsCount: 0,
      recentSearches: ['Coffee', 'Shell Petrol', 'Apollo Pharmacy'],
    };

    try {
      await AsyncStorage.setItem(
        APP_CONFIG.storageKeys.AUTH_USER,
        JSON.stringify(user)
      );
    } catch (e) {
      console.warn('Failed saving user to storage', e);
    }

    return user;
  }

  /**
   * Registers a new account locally
   */
  async register(name: string, email: string, _password: string): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      name: name.trim() || 'New User',
      email: email.trim().toLowerCase(),
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      isGuest: false,
      savedPlacesCount: 0,
      reportsCount: 0,
      recentSearches: ['Coffee', 'ATM'],
    };

    try {
      await AsyncStorage.setItem(
        APP_CONFIG.storageKeys.AUTH_USER,
        JSON.stringify(user)
      );
    } catch (e) {
      console.warn('Failed saving user to storage', e);
    }

    return user;
  }

  /**
   * Continues as Guest
   */
  async loginAsGuest(): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      await AsyncStorage.setItem(
        APP_CONFIG.storageKeys.AUTH_USER,
        JSON.stringify(DEFAULT_USER)
      );
    } catch (e) {
      console.warn('Failed saving guest session', e);
    }
    return DEFAULT_USER;
  }

  /**
   * Logs out user
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(APP_CONFIG.storageKeys.AUTH_USER);
    } catch (e) {
      console.warn('Failed clearing auth storage', e);
    }
  }
}

export const authService = new AuthService();
