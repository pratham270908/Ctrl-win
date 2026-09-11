import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MapView, { UrlTile, Region } from 'react-native-maps';
import { API_CONFIG } from '../constants/apiConfig';

// Fixed central Hyderabad coordinate as required
const HYDERABAD_REGION: Region = {
  latitude: 17.385044,
  longitude: 78.486671,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type TileSource = 'OSM_OFFICIAL' | 'OSM_CARTO' | 'MAPBOX';
type BasemapType = 'standard' | 'none';

export const MapTestScreen: React.FC = () => {
  const [mapReady, setMapReady] = useState(false);
  const [basemapType, setBasemapType] = useState<BasemapType>('standard');
  const [tileSource, setTileSource] = useState<TileSource>('OSM_OFFICIAL');

  const getTileUrl = () => {
    switch (tileSource) {
      case 'OSM_OFFICIAL':
        // Standard OpenStreetMap XYZ tile server
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'OSM_CARTO':
        // High-reliability OpenStreetMap Voyager tiles (CartoCDN, no user-agent block)
        return 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
      case 'MAPBOX':
        return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${API_CONFIG.mapboxApiKey}`;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Minimal isolated MapView occupying flex: 1 */}
        <MapView
          style={styles.map}
          initialRegion={HYDERABAD_REGION}
          mapType={basemapType}
          onMapReady={() => {
            console.log('[MapTestScreen] MapView is mounted and onMapReady fired!');
            setMapReady(true);
          }}
          showsCompass={true}
          showsScale={true}
        >
          {/* OpenStreetMap XYZ Tile Layer */}
          <UrlTile
            key={`${tileSource}-${basemapType}`}
            urlTemplate={getTileUrl()}
            maximumZ={19}
            minimumZ={1}
            zIndex={100}
            flipY={false}
          />
        </MapView>

        {/* Diagnostic Status Overlay */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusTitle}>📍 MAP TEST SCREEN (HYDERABAD)</Text>
          <Text style={styles.statusSub}>
            Status: {mapReady ? '✅ MapView Mounted' : '⏳ Initializing MapView...'}
          </Text>
          <Text style={styles.statusCoords}>
            Lat: {HYDERABAD_REGION.latitude.toFixed(4)}, Lon: {HYDERABAD_REGION.longitude.toFixed(4)}
          </Text>
          <Text style={styles.statusSub2}>
            Active Basemap: {basemapType.toUpperCase()} | Tiles: {tileSource}
          </Text>

          {/* Diagnostic Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[
                styles.chip,
                tileSource === 'OSM_OFFICIAL' && styles.chipActive,
              ]}
              onPress={() => setTileSource('OSM_OFFICIAL')}
            >
              <Text
                style={[
                  styles.chipText,
                  tileSource === 'OSM_OFFICIAL' && styles.chipTextActive,
                ]}
              >
                OSM Official
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                tileSource === 'OSM_CARTO' && styles.chipActive,
              ]}
              onPress={() => setTileSource('OSM_CARTO')}
            >
              <Text
                style={[
                  styles.chipText,
                  tileSource === 'OSM_CARTO' && styles.chipTextActive,
                ]}
              >
                OSM (CartoCDN)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                tileSource === 'MAPBOX' && styles.chipActive,
              ]}
              onPress={() => setTileSource('MAPBOX')}
            >
              <Text
                style={[
                  styles.chipText,
                  tileSource === 'MAPBOX' && styles.chipTextActive,
                ]}
              >
                Mapbox
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.basemapToggleRow}>
            <Text style={styles.toggleLabel}>Base Layer:</Text>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                basemapType === 'standard' && styles.toggleBtnActive,
              ]}
              onPress={() => setBasemapType('standard')}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  basemapType === 'standard' && styles.toggleBtnTextActive,
                ]}
              >
                Standard (Safe)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                basemapType === 'none' && styles.toggleBtnActive,
              ]}
              onPress={() => setBasemapType('none')}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  basemapType === 'none' && styles.toggleBtnTextActive,
                ]}
              >
                Pure Tiles (none)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Required OpenStreetMap Attribution */}
        <View style={styles.attribution} pointerEvents="none">
          <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean background so we know if it's blank
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  statusSub: {
    fontSize: 12,
    color: '#16A34A',
    marginTop: 2,
    fontWeight: '600',
  },
  statusCoords: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusSub2: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  basemapToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  toggleLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  toggleBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  toggleBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  attribution: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attributionText: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '500',
  },
});
