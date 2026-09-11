import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './store/AuthContext';
import { AppProvider, useApp } from './store/AppContext';
import { FavoritesProvider } from './store/FavoritesContext';
import { CustomBottomNav, TabScreen } from './components/CustomBottomNav';
import { Place, PlaceCategory, RouteOption } from './types';
import { COLORS } from './constants/theme';

// Screens
import { SplashScreen } from './app/splash';
import { LoginScreen } from './app/login';
import { OnboardingScreen } from './app/onboarding';
import { HomeScreen } from './app/home';
import { MapScreen } from './app/map';
import { FavoritesScreen } from './app/favorites';
import { ReportsScreen } from './app/reports';
import { ProfileScreen } from './app/profile';
import { SearchScreen } from './app/search';
import { ResultsScreen } from './app/results';
import { PlaceDetailsScreen } from './app/place-details';
import { RouteOptionsScreen } from './app/route-options';
import { NavigationScreen } from './app/navigation';
import { LiveRouteScreen } from './app/live-route';
import { AccessibilityScreen } from './app/accessibility';
import { PublicTransportScreen } from './app/transport';
import { EmergencyScreen } from './app/emergency';
import { OfflineMapsScreen } from './app/offline-maps';
import { SettingsScreen } from './app/settings';

type AppScreen =
  | 'SPLASH'
  | 'LOGIN'
  | 'ONBOARDING'
  | 'TABS'
  | 'SEARCH'
  | 'RESULTS'
  | 'PLACE_DETAILS'
  | 'ROUTE_OPTIONS'
  | 'LIVE_ROUTE'
  | 'NAVIGATION'
  | 'ACCESSIBILITY'
  | 'TRANSPORT'
  | 'EMERGENCY'
  | 'OFFLINE_MAPS'
  | 'SETTINGS';

const MainNavigator: React.FC = () => {
  const { user } = useAuth();
  const { hasCompletedOnboarding, selectedPlace, setSelectedPlace } = useApp();

  const [currentScreen, setCurrentScreen] = useState<AppScreen>('SPLASH');
  const [currentTab, setCurrentTab] = useState<TabScreen>('home');
  const [searchQuery, setSearchQuery] = useState<string>('Coffee');
  const [activeRoute, setActiveRoute] = useState<RouteOption | null>(null);

  // Return to previous screen helper
  const navigateToTabs = (tab: TabScreen = 'home') => {
    setCurrentTab(tab);
    setCurrentScreen('TABS');
  };

  const handleSplashFinish = () => {
    if (!user) {
      setCurrentScreen('LOGIN');
    } else if (!hasCompletedOnboarding) {
      setCurrentScreen('ONBOARDING');
    } else {
      setCurrentScreen('TABS');
    }
  };

  const handleLoginSuccess = () => {
    if (!hasCompletedOnboarding) {
      setCurrentScreen('ONBOARDING');
    } else {
      setCurrentScreen('TABS');
    }
  };

  const handleOnboardingComplete = () => {
    setCurrentScreen('TABS');
  };

  const handleCategorySelect = (category: PlaceCategory) => {
    setSearchQuery(category);
    setCurrentScreen('RESULTS');
  };

  const handleSearchQuerySelect = (query: string) => {
    setSearchQuery(query);
    setCurrentScreen('RESULTS');
  };

  const handlePlaceSelect = (place: Place) => {
    if (!place || !place.id) return;
    setSelectedPlace(place);
    setCurrentScreen('PLACE_DETAILS');
  };

  const handleNavigatePress = (place: Place) => {
    if (!place || !place.id) return;
    setSelectedPlace(place);
    setCurrentScreen('ROUTE_OPTIONS');
  };

  const handleStartNavigation = (route: RouteOption) => {
    setActiveRoute(route);
    setCurrentScreen('NAVIGATION');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* 1. SPLASH SCREEN */}
      {currentScreen === 'SPLASH' && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}

      {/* 2. LOGIN / SIGN UP */}
      {currentScreen === 'LOGIN' && (
        <LoginScreen onSuccess={handleLoginSuccess} />
      )}

      {/* 3. ONBOARDING */}
      {currentScreen === 'ONBOARDING' && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}

      {/* 4. MAIN BOTTOM TABS */}
      {currentScreen === 'TABS' && (
        <View style={styles.contentFlex}>
          {currentTab === 'home' && (
            <HomeScreen
              onSearchPress={() => setCurrentScreen('SEARCH')}
              onCategoryPress={handleCategorySelect}
              onPlacePress={handlePlaceSelect}
              onNavigatePress={handleNavigatePress}
              onProfilePress={() => setCurrentTab('profile')}
              onEmergencyPress={() => setCurrentScreen('EMERGENCY')}
              onOfflineMapsPress={() => setCurrentScreen('OFFLINE_MAPS')}
              onAccessibilityPress={() => setCurrentScreen('ACCESSIBILITY')}
              onTransportPress={() => setCurrentScreen('TRANSPORT')}
              onMapPress={() => navigateToTabs('map')}
            />
          )}

          {currentTab === 'map' && (
            <MapScreen
              onPlacePress={handlePlaceSelect}
              onNavigatePress={handleNavigatePress}
            />
          )}

          {currentTab === 'favorites' && (
            <FavoritesScreen
              onPlacePress={handlePlaceSelect}
              onNavigatePress={handleNavigatePress}
              onExplorePress={() => setCurrentTab('home')}
            />
          )}

          {currentTab === 'activity' && (
            <ReportsScreen />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen
              onOpenFavorites={() => setCurrentTab('favorites')}
              onOpenReports={() => setCurrentTab('activity')}
              onOpenSettings={() => setCurrentScreen('SETTINGS')}
              onOpenOfflineMaps={() => setCurrentScreen('OFFLINE_MAPS')}
              onLogout={() => setCurrentScreen('LOGIN')}
            />
          )}

          {/* Persistent Mobile Bottom Navigation */}
          <CustomBottomNav
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
          />
        </View>
      )}

      {/* 5. SEARCH SCREEN */}
      {currentScreen === 'SEARCH' && (
        <SearchScreen
          onBack={() => navigateToTabs('home')}
          onSelectQuery={handleSearchQuerySelect}
          onSelectCategory={handleCategorySelect}
        />
      )}

      {/* 6. RESULTS SCREEN */}
      {currentScreen === 'RESULTS' && (
        <ResultsScreen
          query={searchQuery}
          onBack={() => navigateToTabs('home')}
          onPlacePress={handlePlaceSelect}
          onNavigatePress={handleNavigatePress}
        />
      )}

      {/* 7. PLACE DETAILS SCREEN */}
      {currentScreen === 'PLACE_DETAILS' && selectedPlace && (
        <PlaceDetailsScreen
          place={selectedPlace}
          onBack={() => navigateToTabs(currentTab)}
          onDirectionsPress={handleNavigatePress}
        />
      )}

      {/* 8. ROUTE OPTIONS SCREEN */}
      {currentScreen === 'ROUTE_OPTIONS' && (
        <RouteOptionsScreen
          destinationPlace={selectedPlace}
          onBack={() => {
            if (selectedPlace) {
              setCurrentScreen('PLACE_DETAILS');
            } else {
              navigateToTabs('home');
            }
          }}
          onStartNavigation={handleStartNavigation}
        />
      )}

      {/* 9. LIVE NAVIGATION SCREEN */}
      {currentScreen === 'NAVIGATION' && (
        <NavigationScreen
          destinationPlace={selectedPlace}
          activeRoute={activeRoute}
          onEndNavigation={() => navigateToTabs('home')}
          onRouteChange={() => setCurrentScreen('ROUTE_OPTIONS')}
        />
      )}

      {/* 10. LIVE ROUTE SCREEN */}
      {currentScreen === 'LIVE_ROUTE' && (
        <LiveRouteScreen
          onBack={() => navigateToTabs('home')}
          onPlacePress={handlePlaceSelect}
          onStartNavigation={() => setCurrentScreen('NAVIGATION')}
        />
      )}

      {/* 11. ACCESSIBILITY ROUTE SCREEN */}
      {currentScreen === 'ACCESSIBILITY' && (
        <AccessibilityScreen
          onBack={() => navigateToTabs('home')}
          onStartAccessibleNavigation={() => setCurrentScreen('NAVIGATION')}
        />
      )}

      {/* 12. PUBLIC TRANSPORT SCREEN */}
      {currentScreen === 'TRANSPORT' && (
        <PublicTransportScreen
          onBack={() => navigateToTabs('home')}
          onSelectTransitRoute={() => setCurrentScreen('NAVIGATION')}
        />
      )}

      {/* 13. EMERGENCY MODE SCREEN */}
      {currentScreen === 'EMERGENCY' && (
        <EmergencyScreen
          onBack={() => navigateToTabs('home')}
          onDirectionsPress={handleNavigatePress}
        />
      )}

      {/* 14. OFFLINE MAPS SCREEN */}
      {currentScreen === 'OFFLINE_MAPS' && (
        <OfflineMapsScreen onBack={() => navigateToTabs(currentTab)} />
      )}

      {/* 15. SETTINGS SCREEN */}
      {currentScreen === 'SETTINGS' && (
        <SettingsScreen onBack={() => navigateToTabs('profile')} />
      )}
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <AppProvider>
          <FavoritesProvider>
            <MainNavigator />
          </FavoritesProvider>
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentFlex: {
    flex: 1,
  },
});
