import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, UserReport, OfflineArea, Place } from '../types';
import { APP_CONFIG } from '../constants/config';

interface AppContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  
  reports: UserReport[];
  addReport: (report: Omit<UserReport, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  
  recentSearches: string[];
  addRecentSearch: (query: string) => Promise<void>;
  clearRecentSearches: () => Promise<void>;
  
  offlineAreas: OfflineArea[];
  toggleOfflineDownload: (areaId: string) => Promise<void>;
  
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;
  
  activeDestination: { name: string; latitude: number; longitude: number; distanceKm: number; estimatedMinutes: number };
  setActiveDestination: (dest: { name: string; latitude: number; longitude: number; distanceKm: number; estimatedMinutes: number }) => void;
  
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  notifications: true,
  locationPermissions: true,
  wheelchairAccessible: false,
  avoidStairs: false,
  avoidTolls: false,
  distanceUnit: 'km',
  theme: 'light',
  voiceGuidance: true,
};

const INITIAL_OFFLINE_AREAS: OfflineArea[] = [
  {
    id: 'area-hyd',
    name: 'Hyderabad Central Corridor',
    sizeMb: 48,
    downloaded: true,
    statusText: 'Downloaded • Available offline',
    lastUpdated: 'Yesterday',
  },
  {
    id: 'area-campus',
    name: 'Gachibowli Tech Campus & Ring Road',
    sizeMb: 32,
    downloaded: false,
    statusText: 'Not downloaded',
  },
  {
    id: 'area-mindspace',
    name: 'Hitec City & Mindspace Zone',
    sizeMb: 24,
    downloaded: true,
    statusText: 'Downloaded • Available offline',
    lastUpdated: '3 days ago',
  },
  {
    id: 'area-city',
    name: 'Greater Hyderabad Metro Map',
    sizeMb: 68,
    downloaded: false,
    statusText: 'Not downloaded',
  },
];

const INITIAL_REPORTS: UserReport[] = [
  {
    id: 'rep-001',
    placeName: 'Old Cyber Cafe',
    reportType: 'Closed place',
    description: 'Place is permanently closed and replaced by an office space.',
    timestamp: '2 hours ago',
    status: 'In Review',
  },
  {
    id: 'rep-002',
    placeName: 'Mindspace Loop Exit',
    reportType: 'Road blocked',
    description: 'Flyover maintenance lane closed till 6 PM.',
    timestamp: 'Yesterday',
    status: 'Resolved',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [reports, setReports] = useState<UserReport[]>(INITIAL_REPORTS);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Coffee',
    'Shell Petrol',
    'HDFC ATM',
    'Medicover Hospital',
  ]);
  const [offlineAreas, setOfflineAreas] = useState<OfflineArea[]>(INITIAL_OFFLINE_AREAS);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activeDestination, setActiveDestination] = useState(APP_CONFIG.defaultDestination);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = async () => {
    try {
      const [savedSettings, savedReports, savedSearches, savedOnboarding] = await Promise.all([
        AsyncStorage.getItem(APP_CONFIG.storageKeys.SETTINGS),
        AsyncStorage.getItem(APP_CONFIG.storageKeys.USER_REPORTS),
        AsyncStorage.getItem(APP_CONFIG.storageKeys.RECENT_SEARCHES),
        AsyncStorage.getItem(APP_CONFIG.storageKeys.ONBOARDING_DONE),
      ]);

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings && typeof parsedSettings === 'object') {
          setSettings((prev) => ({ ...prev, ...parsedSettings }));
        }
      }
      if (savedReports) {
        const parsedReports = JSON.parse(savedReports);
        if (Array.isArray(parsedReports)) {
          setReports(parsedReports);
        }
      }
      if (savedSearches) {
        const parsedSearches = JSON.parse(savedSearches);
        if (Array.isArray(parsedSearches)) {
          setRecentSearches(parsedSearches);
        }
      }
      if (savedOnboarding) {
        setHasCompletedOnboarding(Boolean(JSON.parse(savedOnboarding)));
      }
    } catch {
      // Use defaults
    }
  };

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(
        APP_CONFIG.storageKeys.SETTINGS,
        JSON.stringify(updated)
      );
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  };

  const addReport = async (
    reportData: Omit<UserReport, 'id' | 'timestamp' | 'status'>
  ): Promise<void> => {
    const newReport: UserReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      timestamp: 'Just now',
      status: 'Received',
    };
    const current = Array.isArray(reports) ? reports : [];
    const updated = [newReport, ...current];
    setReports(updated);
    try {
      await AsyncStorage.setItem(
        APP_CONFIG.storageKeys.USER_REPORTS,
        JSON.stringify(updated)
      );
    } catch (e) {
      console.warn('Failed saving report', e);
    }
  };

  const addRecentSearch = async (query: string): Promise<void> => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const current = Array.isArray(recentSearches) ? recentSearches : [];
    const filtered = current.filter((s) => s && s.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 10);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(
        APP_CONFIG.storageKeys.RECENT_SEARCHES,
        JSON.stringify(updated)
      );
    } catch (e) {
      console.warn('Failed saving recent search', e);
    }
  };

  const clearRecentSearches = async (): Promise<void> => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem(APP_CONFIG.storageKeys.RECENT_SEARCHES);
    } catch (e) {
      console.warn('Failed clearing searches', e);
    }
  };

  const toggleOfflineDownload = async (areaId: string): Promise<void> => {
    const current = Array.isArray(offlineAreas) ? offlineAreas : [];
    const updated = current.map((area) => {
      if (area.id === areaId) {
        const willBeDownloaded = !area.downloaded;
        return {
          ...area,
          downloaded: willBeDownloaded,
          statusText: willBeDownloaded
            ? 'Downloaded • Available offline'
            : 'Not downloaded',
          lastUpdated: willBeDownloaded ? 'Just now' : undefined,
        };
      }
      return area;
    });
    setOfflineAreas(updated);
  };

  const completeOnboarding = async (): Promise<void> => {
    setHasCompletedOnboarding(true);
    try {
      await AsyncStorage.setItem(
        APP_CONFIG.storageKeys.ONBOARDING_DONE,
        JSON.stringify(true)
      );
    } catch (e) {
      console.warn('Failed saving onboarding state', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSetting,
        reports,
        addReport,
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
        offlineAreas,
        toggleOfflineDownload,
        selectedPlace,
        setSelectedPlace,
        activeDestination,
        setActiveDestination,
        hasCompletedOnboarding,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
