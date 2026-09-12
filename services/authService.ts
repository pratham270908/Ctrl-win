import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { UserProfile } from '../types';
import { APP_CONFIG, getApiBaseUrl } from '../constants/config';
import { supabase, isSupabaseConfigured } from './supabase';

const TOKEN_KEY = '@smart_dir_auth_token_v1';
const USER_KEY = APP_CONFIG.storageKeys.AUTH_USER;

function formatAuthError(e: any, fallbackMessage: string): Error {
  const msg = e?.message || '';
  const targetUrl = getApiBaseUrl();
  console.warn(`[AuthService] Connectivity failed to ${targetUrl}:`, msg);
  if (
    msg.includes('Network request failed') ||
    msg.includes('Failed to connect') ||
    msg.includes('ConnectException') ||
    msg.includes('fetch failed') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('timed out') ||
    msg.includes('SocketException') ||
    e?.name === 'TypeError'
  ) {
    return new Error('Unable to connect to the server. Please check your connection and try again.');
  }
  return new Error(msg || fallbackMessage);
}

class AuthService {
  private activeToken: string | null = null;

  /**
   * Helper to map Supabase database row to UserProfile
   */
  private mapSupabaseProfile(data: any): UserProfile {
    return {
      id: data.id,
      name: data.display_name || data.email?.split('@')[0] || 'Traveler',
      email: data.email || '',
      avatar:
        data.avatar_url ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      isGuest: false,
      travelMode: data.travel_mode || 'DRIVE',
      distanceUnit: data.distance_units || 'km',
      voiceGuidance: data.voice_guidance !== false,
      notifications: data.notifications !== false,
      wheelchairAccessible: Boolean(data.wheelchair_accessible),
      routePreference: data.route_preference || 'FASTEST',
      savedPlacesCount: data.saved_places_count || 0,
      reportsCount: data.reports_count || 0,
      recentSearches: ['Coffee', 'ATM'],
      updatedAt: data.updated_at,
    };
  }

  /**
   * Loads persisted user session or null (never silently falls back to fake Explorer)
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      // 1. If Supabase is active
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            const user = this.mapSupabaseProfile(profile);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
            return user;
          }
        }
      }

      // 2. If Backend Server Session Token exists
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        this.activeToken = storedToken;
        try {
          const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.user) {
              await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
              return data.user;
            }
          }
        } catch {
          // Fall back to cached user if offline
          const cachedJson = await AsyncStorage.getItem(USER_KEY);
          if (cachedJson) {
            return JSON.parse(cachedJson);
          }
        }
      }

      // Check cached user (e.g. for guest or offline session)
      const cachedJson = await AsyncStorage.getItem(USER_KEY);
      if (cachedJson) {
        const parsed = JSON.parse(cachedJson);
        if (parsed && parsed.id) return parsed;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Authenticates user against real database with verified credentials
   */
  async login(email: string, pass: string): Promise<UserProfile> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (pass || '').trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('Please enter your email and password.');
    }

    // ── Route A: Supabase Cloud Provider ─────────────────────────────────────
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error || !data.user) {
        throw new Error('Incorrect username or password.');
      }

      // Fetch user profile linked by unique user_id
      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      let profile: UserProfile;
      if (profileRow && !profileErr) {
        profile = this.mapSupabaseProfile(profileRow);
      } else {
        // Create initial profile if missing
        profile = {
          id: data.user.id,
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          isGuest: false,
          travelMode: 'DRIVE',
          distanceUnit: 'km',
          voiceGuidance: true,
          notifications: true,
          wheelchairAccessible: false,
          routePreference: 'FASTEST',
          savedPlacesCount: 0,
          reportsCount: 0,
          recentSearches: ['Coffee', 'ATM'],
        };
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: profile.name,
          email: profile.email,
          avatar_url: profile.avatar,
        });
      }

      await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
      return profile;
    }

    // ── Route B: Backend API Provider (Salted Hash + Database) ───────────────
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.user) {
        throw new Error(data.error || 'Incorrect username or password.');
      }

      this.activeToken = data.token;
      if (data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
      }
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));

      return data.user;
    } catch (e: any) {
      if (e?.message === 'Incorrect username or password.') {
        throw e;
      }
      // Connection issue
      throw formatAuthError(e, 'Unable to connect to authentication server. Please try again.');
    }
  }

  /**
   * Registers a new account and creates corresponding profile record in database
   */
  async register(name: string, email: string, pass: string): Promise<UserProfile> {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (pass || '').trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('Email and password are required.');
    }
    if (cleanPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // ── Route A: Supabase Cloud Provider ─────────────────────────────────────
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            name: cleanName || cleanEmail.split('@')[0],
          },
        },
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Registration failed. Please try again.');
      }

      const defaultAvatar =
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

      const initialProfile = {
        id: data.user.id,
        display_name: cleanName || cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar_url: defaultAvatar,
        travel_mode: 'DRIVE',
        distance_units: 'km',
        voice_guidance: true,
        notifications: true,
        wheelchair_accessible: false,
        route_preference: 'FASTEST',
      };

      // Upsert profile record linked by unique user ID
      await supabase.from('profiles').upsert(initialProfile);

      const user: UserProfile = {
        id: data.user.id,
        name: initialProfile.display_name,
        email: cleanEmail,
        avatar: defaultAvatar,
        isGuest: false,
        travelMode: 'DRIVE',
        distanceUnit: 'km',
        voiceGuidance: true,
        notifications: true,
        wheelchairAccessible: false,
        routePreference: 'FASTEST',
        savedPlacesCount: 0,
        reportsCount: 0,
        recentSearches: ['Coffee', 'ATM'],
      };

      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    }

    // ── Route B: Backend API Provider ─────────────────────────────────────────
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.user) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      this.activeToken = data.token;
      if (data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
      }
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));

      return data.user;
    } catch (e: any) {
      if (
        e?.message?.includes('already exists') ||
        e?.message?.includes('Password') ||
        e?.message?.includes('Email') ||
        e?.message?.includes('required')
      ) {
        throw e;
      }
      throw formatAuthError(e, 'Unable to register account. Please check your connection.');
    }
  }

  /**
   * Updates user profile in database and synchronizes local state
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getCurrentUser();
    if (!current || !current.id) {
      throw new Error('No authenticated user session found.');
    }

    const updated: UserProfile = {
      ...current,
      ...updates,
      id: current.id, // Never allow changing user ID
      updatedAt: new Date().toISOString(),
    };

    // 1. Update Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const dbPayload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.name !== undefined) dbPayload.display_name = updates.name;
      if (updates.avatar !== undefined) dbPayload.avatar_url = updates.avatar;
      if (updates.travelMode !== undefined) dbPayload.travel_mode = updates.travelMode;
      if (updates.distanceUnit !== undefined) dbPayload.distance_units = updates.distanceUnit;
      if (updates.voiceGuidance !== undefined) dbPayload.voice_guidance = updates.voiceGuidance;
      if (updates.notifications !== undefined) dbPayload.notifications = updates.notifications;
      if (updates.wheelchairAccessible !== undefined) dbPayload.wheelchair_accessible = updates.wheelchairAccessible;
      if (updates.routePreference !== undefined) dbPayload.route_preference = updates.routePreference;

      await supabase.from('profiles').update(dbPayload).eq('id', current.id);
    } else {
      // 2. Update Backend Database
      try {
        const token = this.activeToken || (await AsyncStorage.getItem(TOKEN_KEY));
        await fetch(`${getApiBaseUrl()}/api/auth/update-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ userId: current.id, updates }),
        });
      } catch (err) {
        console.warn('Backend sync failed, saving locally:', err);
      }
    }

    // Persist to user cache
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  }

  /**
   * Continues as Guest Traveler
   */
  async loginAsGuest(): Promise<UserProfile> {
    const guestUser: UserProfile = {
      id: `guest_${Date.now()}`,
      name: 'Guest Traveler',
      email: 'guest@specfinder.app',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      isGuest: true,
      travelMode: 'DRIVE',
      distanceUnit: 'km',
      voiceGuidance: true,
      notifications: true,
      wheelchairAccessible: false,
      routePreference: 'FASTEST',
      savedPlacesCount: 0,
      reportsCount: 0,
      recentSearches: ['Coffee', 'ATM'],
    };

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(guestUser));
    return guestUser;
  }

  /**
   * Logs out user: terminates session and wipes cached user data completely
   */
  async logout(): Promise<void> {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      } else {
        const token = this.activeToken || (await AsyncStorage.getItem(TOKEN_KEY));
        if (token) {
          fetch(`${getApiBaseUrl()}/api/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      }
    } catch {
      // Ignore network errors during logout
    }

    this.activeToken = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  }
}

export const authService = new AuthService();
