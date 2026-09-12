import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Place } from '../types';
import { APP_CONFIG } from '../constants/config';
import { MOCK_PLACES } from '../data/mockPlaces';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: Place[];
  isFavorite: (placeId: string) => boolean;
  toggleFavorite: (place: Place) => Promise<void>;
  removeFavorite: (placeId: string) => Promise<void>;
  clearFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Place[]>([]);

  const getStorageKey = () => {
    return user?.id ? `${APP_CONFIG.storageKeys.FAVORITES}_${user.id}` : APP_CONFIG.storageKeys.FAVORITES;
  };

  useEffect(() => {
    loadFavorites();
  }, [user?.id]);

  const loadFavorites = async () => {
    try {
      const key = getStorageKey();
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed.filter((p) => p && p.id));
          return;
        }
      }
      // If guest or brand new user with no stored favorites
      if (!user || user.isGuest) {
        const initial = [MOCK_PLACES[0], MOCK_PLACES[6]];
        setFavorites(initial);
      } else {
        setFavorites([]);
      }
    } catch {
      setFavorites([]);
    }
  };

  const isFavorite = (placeId: string): boolean => {
    if (!placeId || !Array.isArray(favorites)) return false;
    return favorites.some((p) => p && p.id === placeId);
  };

  const toggleFavorite = async (place: Place): Promise<void> => {
    if (!place || !place.id) return;
    try {
      const current = Array.isArray(favorites) ? favorites : [];
      let updated: Place[];
      if (isFavorite(place.id)) {
        updated = current.filter((p) => p && p.id !== place.id);
      } else {
        updated = [place, ...current.filter((p) => p && p.id !== place.id)];
      }
      setFavorites(updated);
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed updating favorites in storage', e);
    }
  };

  const removeFavorite = async (placeId: string): Promise<void> => {
    if (!placeId) return;
    try {
      const current = Array.isArray(favorites) ? favorites : [];
      const updated = current.filter((p) => p && p.id !== placeId);
      setFavorites(updated);
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed removing favorite from storage', e);
    }
  };

  const clearFavorites = async (): Promise<void> => {
    try {
      setFavorites([]);
      await AsyncStorage.removeItem(getStorageKey());
    } catch (e) {
      console.warn('Failed clearing favorites', e);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
