import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent, WebViewProps } from 'react-native-webview';
import { LabInfoBottomSheet } from '../components/LabInfoBottomSheet';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { useLabLocations } from '../hooks/useLabLocations';
import { calculateDistance } from '../services/locationService';
import { listenSessions } from '../services/sessionService';
import { LabLocation, SessionItem } from '../types/models';

const LeafletWebView = WebView as unknown as React.ComponentType<
  WebViewProps & { ref?: React.Ref<{ injectJavaScript: (script: string) => void } | null> }
>;

export const MapScreen: React.FC = () => {
  const router = useRouter();
  const webViewRef = useRef<{ injectJavaScript: (script: string) => void } | null>(null);

  const { labs } = useLabLocations();
  const { location, refreshLocation } = useCurrentLocation(true);

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedLab, setSelectedLab] = useState<LabLocation | null>(null);
  const [sheetVisible, setSheetVisible] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);

  // 1. Listen ke semua sesi untuk mencocokkan sesi berjalan & berikutnya
  useEffect(() => {
    const unsub = listenSessions((allSessions) => {
      setSessions(allSessions);
    });
    return () => unsub();
  }, []);

  // Koordinat pusat peta default (Kampus / Lab B, C, D, AP)
  const centerCoords = useMemo(() => {
    if (labs.length > 0) {
      return {
        latitude: labs[0].latitude,
        longitude: labs[0].longitude,
      };
    }
    return {
      latitude: -7.048248,
      longitude: 110.440831,
    };
  }, [labs]);

  // Serialize data lab untuk HTML Leaflet (hanya berubah saat daftar lab berubah)
  const labsJson = useMemo(
    () =>
      JSON.stringify(
        labs.map((l) => ({
          id: l.id,
          name: l.name,
          building: l.building,
          latitude: l.latitude,
          longitude: l.longitude,
          radiusMeters: l.radiusMeters,
        }))
      ),
    [labs]
  );

  // HTML Leaflet + OpenStreetMap resmi (legal dengan atribusi OpenStreetMap contributors)
  const mapHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #E5E7EB;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .lab-pin {
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
    }
    .lab-badge {
      background: #DC2626;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 12px;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      white-space: nowrap;
    }
    .lab-dot {
      width: 10px;
      height: 10px;
      background: #DC2626;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      margin-top: -3px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .user-pulse {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #2563EB;
      border: 2px solid #FFFFFF;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    }
    .leaflet-control-attribution {
      font-size: 9px !important;
      margin-bottom: 72px !important;
      background: rgba(255,255,255,0.85) !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var labs = ${labsJson};
    var map = L.map('map', {
      zoomControl: false
    }).setView([${centerCoords.latitude}, ${centerCoords.longitude}], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 20,
      subdomains: 'abc',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    labs.forEach(function(lab) {
      L.circle([lab.latitude, lab.longitude], {
        radius: lab.radiusMeters || 100,
        color: '#2563EB',
        weight: 1.5,
        fillColor: '#2563EB',
        fillOpacity: 0.12
      }).addTo(map);

      var icon = L.divIcon({
        className: '',
        html: '<div class="lab-pin"><div class="lab-badge">' + lab.name + '</div><div class="lab-dot"></div></div>',
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      var marker = L.marker([lab.latitude, lab.longitude], { icon: icon }).addTo(map);
      marker.on('click', function() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SELECT_LAB',
            labId: lab.id
          }));
        }
      });
    });

    var userMarker = null;
    window.updateUserLocation = function(lat, lng, accuracy) {
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      if (!userMarker) {
        var userIcon = L.divIcon({
          className: '',
          html: '<div class="user-pulse"><div class="user-dot"></div></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      } else {
        userMarker.setLatLng([lat, lng]);
      }
    };

    window.centerOnUser = function(lat, lng) {
      if (typeof lat === 'number' && typeof lng === 'number') {
        window.updateUserLocation(lat, lng);
        map.flyTo([lat, lng], 18, { duration: 0.6 });
      }
    };
  </script>
</body>
</html>`;
  }, [labsJson, centerCoords.latitude, centerCoords.longitude]);

  // Sinkronkan posisi GPS pengguna ke marker Leaflet tanpa reload WebView
  useEffect(() => {
    if (mapReady && location?.coords && webViewRef.current) {
      const { latitude, longitude, accuracy } = location.coords;
      webViewRef.current.injectJavaScript(
        `window.updateUserLocation(${latitude}, ${longitude}, ${accuracy ?? 0}); true;`
      );
    }
  }, [mapReady, location]);

  // Handler pesan dari Leaflet saat marker lab ditekan
  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type === 'SELECT_LAB' && payload.labId) {
        const found = labs.find((l) => l.id === payload.labId);
        if (found) {
          setSelectedLab(found);
          setSheetVisible(true);
        }
      }
    } catch {
      // Abaikan pesan yang tidak valid
    }
  };

  // Hitung sesi berjalan dan sesi berikutnya untuk lab terpilih
  const scheduleInfo = useMemo(() => {
    if (!selectedLab) return { currentSession: null, nextSession: null };

    const labNameLower = selectedLab.name.toLowerCase();
    const labIdLower = selectedLab.id.toLowerCase();

    const matchingSessions = sessions.filter((s) => {
      const room = (s.roomName || '').toLowerCase();
      return (
        room === labNameLower ||
        room.includes(labNameLower) ||
        labNameLower.includes(room) ||
        room.includes(labIdLower)
      );
    });

    const currentSession =
      matchingSessions.find((s) => s.status === 'BERJALAN') || null;
    const nextSession =
      matchingSessions.find((s) => s.status === 'BELUM_DIBUKA') || null;

    return { currentSession, nextSession };
  }, [selectedLab, sessions]);

  // Jarak pengguna ke lab terpilih
  const userDistanceToSelectedLab = useMemo(() => {
    if (!selectedLab || !location?.coords) return null;
    return Math.round(
      calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        selectedLab.latitude,
        selectedLab.longitude
      )
    );
  }, [selectedLab, location]);

  const handleCenterOnUser = () => {
    if (location?.coords && webViewRef.current) {
      const { latitude, longitude } = location.coords;
      webViewRef.current.injectJavaScript(
        `window.centerOnUser(${latitude}, ${longitude}); true;`
      );
    } else {
      refreshLocation();
    }
  };

  const handleNavigateToAttendance = (session: SessionItem) => {
    setSheetVisible(false);
    router.push({
      pathname: '/attendance',
      params: {
        sessionId: session.id,
        id: session.id,
        courseTitle: session.courseTitle,
        moduleName: session.moduleName,
        classGroup: session.classGroup,
        roomName: session.roomName,
        timeSlot: session.timeSlot,
        status: session.status,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* OpenStreetMap (CARTO) + Leaflet WebView */}
      <LeafletWebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: mapHtml, baseUrl: 'https://localhost' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="compatibility"
        onMessage={handleWebViewMessage}
        onLoadEnd={() => setMapReady(true)}
      />

      {!mapReady && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat peta OpenStreetMap...</Text>
        </View>
      )}

      {/* Floating Header */}
      <SafeAreaView style={styles.floatingHeader} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Peta Laboratorium</Text>
            <Text style={styles.headerSubtitle}>
              {labs.length} Lab • OpenStreetMap
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCenterOnUser}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>🎯</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Legend Card Floating di Bawah */}
      <View style={styles.legendCard}>
        <View style={styles.legendItem}>
          <View style={styles.legendUserDot} />
          <Text style={styles.legendText}>Lokasi Anda</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendLabDot} />
          <Text style={styles.legendText}>Lab Praktikum</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendCircleBox} />
          <Text style={styles.legendText}>Radius 100 m</Text>
        </View>
      </View>

      {/* Bottom Sheet Informasi Lab Terpilih */}
      <LabInfoBottomSheet
        visible={sheetVisible}
        lab={selectedLab}
        currentSession={scheduleInfo.currentSession}
        nextSession={scheduleInfo.nextSession}
        userDistanceMeters={userDistanceToSelectedLab}
        onClose={() => setSheetVisible(false)}
        onNavigateToAttendance={handleNavigateToAttendance}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  map: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E5E7EB',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(243, 244, 246, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerTitleBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 1,
  },
  legendCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendUserDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  legendLabDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  legendCircleBox: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
});

export default MapScreen;
