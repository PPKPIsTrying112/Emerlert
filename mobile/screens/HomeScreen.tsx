import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Vibration } from 'react-native';
import { Barometer } from 'expo-sensors';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';

const pressureToAltitude = (pressure: number, seaLevelPressure: number): number => {
  return 44330 * (1 - Math.pow(pressure / seaLevelPressure, 0.1903));
};

export default function HomeScreen() {
  const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SENT'>('IDLE');
  const [currentPressure, setCurrentPressure] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("⚠️ Setup Required", "You MUST enable location for this app to work.");
      }
    })();

    Linking.getInitialURL().then((url) => {
      if (url && url.includes('trigger')) handleTrigger();
    });

    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url.includes('trigger')) handleTrigger();
    });

    Barometer.isAvailableAsync().then((available) => {
      if (available) {
        Barometer.addListener((data) => setCurrentPressure(data.pressure));
      }
    });

    return () => subscription.remove();
  }, []);

  const calculateFloor = async (lat: number, lng: number) => {
    if (!currentPressure) return null;
    try {
      const response = await fetch('https://emerlert-t3b6.vercel.app/api/calculate-floor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, pressure: currentPressure })
      });
      const data = await response.json();
      return data.floor;
    } catch {
      return null;
    }
  };

  const handleTrigger = async () => {
    if (status !== 'IDLE') return;
    setStatus('SENDING');
    Vibration.vibrate(100);

    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert("🚫 Permission Error", "Please enable Location in Settings.");
        setStatus('IDLE');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const floor = await calculateFloor(location.coords.latitude, location.coords.longitude);

      const response = await fetch('https://emerlert-t3b6.vercel.app/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo_user',
          location: { lat: location.coords.latitude, lng: location.coords.longitude },
          floor
        })
      });

      const data = await response.json();
      if (data.success) {
        setStatus('SENT');
        Vibration.vibrate([0, 500, 200, 500]);
        Alert.alert("✅ SIGNAL RECEIVED", "Help is on the way!");
      } else {
        throw new Error("Server rejected request");
      }
    } catch (error) {
      Alert.alert("❌ FAILED", "Could not reach server.");
      setStatus('IDLE');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: status === 'SENT' ? '#22c55e' : '#f2f2f2' }]}>
      <Text style={styles.title}>
        {status === 'IDLE' && "EMERGENCY SYSTEM"}
        {status === 'SENDING' && "CONTACTING HQ..."}
        {status === 'SENT' && "HELP DISPATCHED"}
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: status === 'IDLE' ? '#ef4444' : '#ffffff' }]}
        onPress={handleTrigger}
        disabled={status === 'SENT'}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: status === 'IDLE' ? '#ffffff' : '#000000' }]}>
          {status === 'SENT' ? '✓' : 'SOS'}
        </Text>
      </TouchableOpacity>

      {status !== 'IDLE' && (
        <TouchableOpacity onPress={() => setStatus('IDLE')} style={styles.resetBtn}>
          <Text style={styles.resetText}>Reset System</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 50, color: '#333', letterSpacing: 1 },
  button: {
    width: 220, height: 220, borderRadius: 110,
    justifyContent: 'center', alignItems: 'center',
    elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)'
  },
  buttonText: { fontSize: 56, fontWeight: '900', letterSpacing: 2 },
  resetBtn: { marginTop: 40, padding: 10 },
  resetText: { fontSize: 16, color: '#555', textDecorationLine: 'underline' },
});