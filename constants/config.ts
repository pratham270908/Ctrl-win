import { Platform, NativeModules } from 'react-native';

/**
 * Automatically discovers the host machine IP when running via Metro/Expo on a physical device.
 */
export function getDevHost(): string | null {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/i) || scriptURL.match(/^exp:\/\/([^:/]+)/i);
      if (match && match[1]) {
        const host = match[1];
        if (host !== 'localhost' && host !== '127.0.0.1' && host !== '10.0.2.2') {
          return host;
        }
      }
    }
  } catch {
    // Ignore error
  }
  return null;
}

// Authoritative development machine LAN IP and port
export const DEV_LAN_IP = '14.14.0.81';
export const DEV_PORT = 3000;

/**
 * Returns the authoritative backend API base URL.
 * Priority:
 * 1. Explicit EXPO_PUBLIC_API_URL or API_BASE_URL from environment
 * 2. Metro host IP (if available from scriptURL)
 * 3. Authoritative host LAN IP (http://14.14.0.81:3000) for mobile devices
 * 4. Localhost for web runtime
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL.replace(/\/+$/, '');
  }

  if (Platform.OS === 'web') {
    return `http://localhost:${DEV_PORT}`;
  }

  // Auto-detect development machine LAN IP from Metro bundle URL if present
  const devHost = getDevHost();
  if (devHost) {
    return `http://${devHost}:${DEV_PORT}`;
  }

  // Authoritative host LAN IP for physical Android/iOS devices
  return `http://${DEV_LAN_IP}:${DEV_PORT}`;
}

export const APP_CONFIG = {
  name: 'Smart Directional',
  fullName: 'Smart Directional Location Finder',
  version: '1.0.0',
  slogan: 'Not the nearest place — the most useful place for your journey.',
  supportEmail: 'support@smartdirectional.app',
  get apiBaseUrl() {
    return getApiBaseUrl();
  },
  defaultLocation: {
    latitude: 17.4375,
    longitude: 78.3852, // Hitec City / Madhapur corridor, Hyderabad
    heading: 45, // Traveling North-East
    headingText: 'North-East',
    speedKmh: 38,
    accuracyMeters: 5,
    label: 'Cyber Towers Junction, Hyderabad',
  },
  defaultDestination: {
    name: 'Gachibowli Tech Campus',
    latitude: 17.4435,
    longitude: 78.398,
    distanceKm: 2.4,
    estimatedMinutes: 8,
  },
  storageKeys: {
    FAVORITES: '@smart_dir_favorites_v1',
    AUTH_USER: '@smart_dir_auth_user_v1',
    SETTINGS: '@smart_dir_settings_v1',
    ONBOARDING_DONE: '@smart_dir_onboarding_done_v1',
    RECENT_SEARCHES: '@smart_dir_recent_searches_v1',
    USER_REPORTS: '@smart_dir_user_reports_v1',
    OFFLINE_AREAS: '@smart_dir_offline_areas_v1',
    RECENT_ROUTES: '@smart_dir_recent_routes_v1',
  },
};
