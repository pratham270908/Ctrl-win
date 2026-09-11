# Smart Directional Location Finder 📍

> **“Not the nearest place — the most useful place for your journey.”**

A mobile-first navigation app built with **React Native**, **Expo**, and **TypeScript**. Designed from the ground up to solve the classic navigation frustration: instead of blindly routing you to the closest shop behind you or requiring tedious U-turns, this application intelligently ranks places based on **travel trajectory, forward heading, and journey utility**.

---

## 🌟 Key Innovations & Features

### 1. Directional Vector Intelligence
- **AHEAD OF YOU**: Places in the direct forward path (within the forward travel corridor).
- **ON YOUR ROUTE**: Places along the journey corridor with minimal stopover deviations (+1 to 2 min).
- **BEHIND YOU**: Places located behind your current travel vector requiring U-turns or backtracking.
- Built-in mathematical bearing calculation (`utils/directionUtils.ts`) computing real Great-Circle distance and azimuth difference from simulated coordinates (`17.4375, 78.3852` heading 45° NE).

### 2. Multi-Screen Native Mobile Experience (17 Interactive Screens)
1. **Splash Screen** (`app/splash.tsx`): Scenic road horizon visual, pulsing compass branding, auto-transition.
2. **Login / Sign Up** (`app/login.tsx`): Mock authentication, validation, registration, and Guest traveler mode.
3. **Onboarding Flow** (`app/onboarding.tsx`): 3-step illustrated walkthrough of trajectory awareness with local completion state.
4. **Home Dashboard** (`app/home.tsx`): Search bar, quick category icons, directional compass widget, interactive map preview, shortcuts, and recommended places.
5. **Interactive Map Screen** (`app/map.tsx`): Real canvas-style map with roads, route vectors, pulsing user marker, category filters, and selectable place cards.
6. **Dedicated Search Screen** (`app/search.tsx`): Recent searches, live typing suggestions, and popular categories.
7. **Search Results Screen** (`app/results.tsx`): List/Map toggle with distinct AHEAD, ON ROUTE, and BEHIND sections.
8. **Smart Sorting Modal** (`components/SortSheet.tsx`): Interactive bottom sheet that actually re-ranks results by:
   - *Best Overall Journey Fit* (Composite trajectory score)
   - *Nearest Distance*
   - *Highest Rated*
   - *Shortest Travel Time*
9. **Place Details Screen** (`app/place-details.tsx`): Map view, directional status banner, address, operating hours, phone, services, Call, Share, and Save to Favorites.
10. **Route Options Screen** (`app/route-options.tsx`): Choose between **Fastest**, **Lowest Deviation**, and **Best Overall** route variants.
11. **Turn-by-Turn Navigation Screen** (`app/navigation.tsx`): Full navigation viewport with turn banners ("Continue straight 250m"), speed gauge, Mute toggle, Recenter, and End Navigation.
12. **Live Route Awareness Screen** (`app/live-route.tsx`): Displays upcoming pit-stops (coffee, fuel, ATM) en route.
13. **Accessibility Route Screen** (`app/accessibility.tsx`): Step-free routing preferences (Wheelchair friendly, Avoid stairs, Low-grade inclines).
14. **Public Transport Lines Screen** (`app/transport.tsx`): Bus 216, Blue Line Metro, and Airport Shuttles with stops progression timeline.
15. **Emergency Mode Screen** (`app/emergency.tsx`): High-contrast triage view for 24/7 Trauma Centers, Police, Ambulance, and Pharmacies.
16. **Offline Maps Screen** (`app/offline-maps.tsx`): Downloaded packs and popular regions with simulated download/delete toggling.
17. **User Activity & Reports Screen** (`app/reports.tsx`): Submit road blockage or closed place reports with persistent local activity log.
18. **Favorites Screen** (`app/favorites.tsx`): Persistent bookmarks stored with `AsyncStorage`.
19. **Profile Screen** (`app/profile.tsx`): User avatar, journey statistics, and navigation links.
20. **Settings Screen** (`app/settings.tsx`): Working toggles for push notifications, location permissions, voice guidance, tolls, and units (km vs miles).

---

## 🛠️ Clean Architecture (Service Layer Ready for Production APIs)

All mock services are isolated and mirror production SDK contracts:
```
services/
├── locationService.ts    --> Ready for expo-location / GPS
├── placesService.ts      --> Ready for Google Places API / Mapbox Search
├── directionsService.ts  --> Ready for Google Directions API / OSRM
└── authService.ts        --> Ready for Supabase / Firebase / Auth0
```

---

## 🚀 Running the Mobile Application

### Requirements
- Node.js (v18+)
- Expo CLI (`npx expo`)
- Expo Go app on Android or iOS (or an Android Emulator)

### Starting the Project
```bash
# 1. Install dependencies
npm install

# 2. Start the Expo development server
npx expo start
```

### Opening on Android Device
1. Open the **Expo Go** app on your Android phone.
2. Scan the QR code displayed in your terminal.
3. The app will launch instantly in Expo Go!

---

## 🧪 Verified User Journeys (No Dead Ends)
- **Splash → Login → Guest Mode → Home Dashboard**
- **Home → Tap ☕ Coffee → Search Results grouped into AHEAD / ON ROUTE / BEHIND**
- **Tap Sort Button → Switch from Best Overall to "Highest Rated" → Results reorder immediately**
- **Select "Brew Corner" → Place Details → Tap Heart to Save → Check Favorites Tab**
- **Place Details → Tap "View Route Options" → Select "Fastest Route" → "Start Navigation"**
- **Navigation Screen → Tap "Mute" to silence guidance → Tap "End" to return to Home**
- **Home → Tap 🚨 Emergency → Instant nearest 24/7 Trauma Centers with quick call dialog**