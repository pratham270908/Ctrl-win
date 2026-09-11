export const APP_CONFIG = {
  name: 'Smart Directional',
  fullName: 'Smart Directional Location Finder',
  version: '1.0.0',
  slogan: 'Not the nearest place — the most useful place for your journey.',
  supportEmail: 'support@smartdirectional.app',
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
