import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Circle, Marker, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LabInfoBottomSheet } from '../components/LabInfoBottomSheet';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { useLabLocations } from '../hooks/useLabLocations';
import { calculateDistance } from '../services/locationService';
import { listenSessions } from '../services/sessionService';
import { LabLocation, SessionItem } from '../types/models';

export const MapScreen: React.FC = () => {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);

  const { labs } = useLabLocations();
  const { location, refreshLocation } = useCurrentLocation(true);

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedLab, setSelectedLab] = useState<LabLocation | null>(null);
  const [sheetVisible, setSheetVisible] = useState<boolean>(false);

  // 1. Listen ke semua sesi untuk mencocokkan sesi berjalan & berikutnya
  useEffect(() => {
    const unsub = listenSessions((allSessions) => {
      setSessions(allSessions);
    });
    return () => unsub();
  }, []);

  // Koordinat pusat peta default (Kampus / Lab B, C, D, AP)
  const initialRegion = useMemo(() => {
    if (labs.length > 0) {
      return {
        latitude: labs[0].latitude,
        longitude: labs[0].longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }
    return {
      latitude: -7.048248,
      longitude: 110.440831,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
  }, [labs]);

  // Handler saat marker lab ditekan
  const handleSelectLab = (lab: LabLocation) => {
    setSelectedLab(lab);
    setSheetVisible(true);
  };

  // Hitung sesi berjalan dan sesi berikutnya untuk lab terpilih
  const scheduleInfo = useMemo(() => {
    if (!selectedLab) return { currentSession: null, nextSession: null };

    const labNameLower = selectedLab.name.toLowerCase();
    const labIdLower = selectedLab.id.toLowerCase();

    // Saring sesi yang ruangannya cocok dengan lab terpilih
    const matchingSessions = sessions.filter((s) => {
      const room = (s.roomName || '').toLowerCase();
      return (
        room.includes(labNameLower) ||
        labNameLower.includes(room) ||
        room.includes(labIdLower)
      );
    });

    // currentSession: status BERJALAN
    const currentSession =
      matchingSessions.find((s) => s.status === 'BERJALAN') || null;

    // nextSession: status BELUM_DIBUKA
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
    if (location?.coords && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        800
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

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        mapType={Platform.OS === 'android' ? 'none' : 'standard'}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* OpenStreetMap Tile Layer */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
        />

        {/* Visualisasi Radius Presensi Tiap Lab */}
        {labs.map((lab) => (
          <Circle
            key={`circle-${lab.id}`}
            center={{
              latitude: lab.latitude,
              longitude: lab.longitude,
            }}
            radius={lab.radiusMeters}
            fillColor="rgba(37, 99, 235, 0.12)"
            strokeColor="#2563EB"
            strokeWidth={1.5}
          />
        ))}

        {/* Marker Laboratorium (Merah / Oranye) */}
        {labs.map((lab) => (
          <Marker
            key={`marker-lab-${lab.id}`}
            coordinate={{
              latitude: lab.latitude,
              longitude: lab.longitude,
            }}
            title={lab.name}
            description={`${lab.building} • Radius: ${lab.radiusMeters}m`}
            onPress={() => handleSelectLab(lab)}
          >
            <View style={styles.labMarkerBox}>
              <Text style={{ fontSize: 14 }}>🏛️</Text>
            </View>
          </Marker>
        ))}

        {/* Marker Posisi Pengguna Real-Time (Biru) */}
        {location?.coords && (
          <Marker
            key="user-marker"
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Lokasi Anda"
            description={
              location.coords.accuracy
                ? `Akurasi: ±${Math.round(location.coords.accuracy)}m`
                : 'Posisi perangkat saat ini'
            }
          >
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarkerPulse} />
              <View style={styles.userMarkerDot}>
                <Text style={{ fontSize: 10, color: '#FFFFFF' }}>👤</Text>
              </View>
            </View>
          </Marker>
        )}
      </MapView>

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
              {labs.length} Lab • Real-time GPS
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
          <Text style={styles.legendText}>Lab Komputer</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendCircleBox} />
          <Text style={styles.legendText}>Radius Presensi</Text>
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
    backgroundColor: '#F3F4F6',
  },
  map: {
    ...StyleSheet.absoluteFill,
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
  labMarkerBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  userMarkerContainer: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  userMarkerDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
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
