import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Vibration } from 'react-native';
import { Barometer } from 'expo-sensors';


// 1. IMPORT THE TOOLS
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';

// Converts pressure reading to altitude in meters
const pressureToAltitude = (pressure: number, seaLevelPressure: number): number => {
  return 44330 * (1 - Math.pow(pressure / seaLevelPressure, 0.1903));
};

export default function App() {
  // ---------------------------------------------------------
  // 1. STATE MANAGEMENT (The "Brain")
  // ---------------------------------------------------------
  // IDLE: Waiting for user.
  // SENDING: The "Optimistic" state (Green button, but API is still thinking).
  // SENT: Confirmed success from server.
  const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SENT'>('IDLE');
  const [baroSubscription, setBaroSubscription] = useState(null);
  const [floorEstimate, setFloorEstimate] = useState<number | null>(null);
  const [currentPressure, setCurrentPressure] = useState<number | null>(null);

  
  // Debugging: Shows your specific deep link scheme
  const urlScheme = Linking.createURL('');

  // ---------------------------------------------------------
  // 2. THE SETUP (The "Paperwork")
  // ---------------------------------------------------------
  useEffect(() => {
    // A. PERMISSIONS CHECK
    // Resume Bullet: "Proactive Permission Handling"
    (async () => {
      // We ask quietly on app load so we don't block emergencies later
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("⚠️ Setup Required", "You MUST enable location for this app to work.");
      }
    })();

    // B. DEEP LINK LISTENER (Siri / Shortcuts Integration)
    // Resume Bullet: "Deep Linking & System Integration"
    
    // 1. Cold Start: App was dead -> User used Siri -> App opens
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('trigger')) {
        handleTrigger();
      }
    });

    // 2. Background: App was open -> User used Siri -> App switches to front
    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url.includes('trigger')) {
        handleTrigger();
      }
    });

   Barometer.isAvailableAsync().then((available) => {
      if (available) {
        console.log('Nice! Barometer available!');
        const sub = Barometer.addListener((data) => {
          setCurrentPressure(data.pressure); // Save the latest reading
          console.log('📊 Pressure:', data.pressure, 'hPa');
        });
        setBaroSubscription(sub);
      } else {
        console.log('X: Barometer not available on this device');
      }
    });
    return () => subscription.remove();
  }, []);

  // Calculate floor estimate using barometer + APIs
  const calculateFloor = async (lat: number, lng: number) => {
  if (!currentPressure) return null;

  try {
    const response = await fetch('https://emerlert-t3b6.vercel.app/api/calculate-floor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat,
        lng,
        pressure: currentPressure
      })
    });

    const data = await response.json();
    console.log('🏢 Floor estimate:', data.floor);
    return data.floor;

  } catch (error) {
    console.error('Floor calculation failed:', error);
    return null;
  }
  };

  // ---------------------------------------------------------
  // 3. THE TRIGGER LOGIC (The "Core Feature")
  // ---------------------------------------------------------
  const handleTrigger = async () => {
    // Prevent double-clicks
    if (status !== 'IDLE') return;

    // A. OPTIMISTIC UI (Resume Bullet: "<50ms Latency")
    setStatus('SENDING');
    Vibration.vibrate(100);

    try {
      // 🛡️ SECURITY CHECKPOINT (The Fix for your crash) 🛡️
      // We double-check permission right before sending.
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;

      // If missing, ask ONE LAST TIME
      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      // If still missing, abort to prevent crash
      if (finalStatus !== 'granted') {
        Alert.alert("🚫 Permission Error", "Please go to Settings > Privacy and enable Location.");
        setStatus('IDLE');
        return;
      }

      // B. DATA COLLECTION
      // Now it is safe to run this command
      let location = await Location.getCurrentPositionAsync({});
      console.log("📍 GPS Secured:", location.coords);

      // Calculate floor estimate
      const floor = await calculateFloor(location.coords.latitude, location.coords.longitude);
      console.log("🏢 Estimated floor:", floor);

      // C. NETWORK REQUEST (The "Microservice" Call)
      // ⚠️ IMPORTANT: I changed port 8082 back to 3000 because your backend screenshot said 3000.
      const response = await fetch('https://emerlert-t3b6.vercel.app/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo_user',
          location: {
            lat: location.coords.latitude,
            lng: location.coords.longitude
          },
          floor: floor
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatus('SENT');
        Vibration.vibrate([0, 500, 200, 500]); // Success buzz pattern
        Alert.alert("✅ SIGNAL RECEIVED", "Help is on the way!");
      } else {
        throw new Error("Server rejected request");
      }

    } catch (error) {
      console.error("Transmission Failed:", error);
      Alert.alert("❌ FAILED", "Could not reach server. Is the backend running?");
      setStatus('IDLE');
    }
  };

  const handleReset = () => {
    setStatus('IDLE');
  };

  

  // ---------------------------------------------------------
  // 4. THE VISUALS
  // ---------------------------------------------------------
  return (
    <View style={[
      styles.container, 
      { backgroundColor: status === 'SENT' ? '#22c55e' : '#f2f2f2' }
    ]}>
      
      <Text style={styles.title}>
        {status === 'IDLE' && "EMERGENCY SYSTEM"}
        {status === 'SENDING' && "CONTACTING HQ..."}
        {status === 'SENT' && "HELP DISPATCHED"}
      </Text>

      {/* THE BIG BUTTON */}
      <TouchableOpacity 
        style={[
          styles.button, 
          { backgroundColor: status === 'IDLE' ? '#ef4444' : '#ffffff' }
        ]}
        onPress={handleTrigger}
        disabled={status === 'SENT'}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.buttonText,
          { color: status === 'IDLE' ? '#ffffff' : '#000000' }
        ]}>
          {status === 'SENT' ? '✓' : 'SOS'}
        </Text>
      </TouchableOpacity>

      {/* Reset System */}
      {status !== 'IDLE' && (
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
          <Text style={styles.resetText}>Reset System</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.debugText}>Link: {urlScheme}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    marginBottom: 50, 
    color: '#333', 
    letterSpacing: 1 
  },
  button: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  buttonText: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 2,
  },
  resetBtn: { marginTop: 40, padding: 10 },
  resetText: { fontSize: 16, color: '#555', textDecorationLine: 'underline' },
  debugText: { position: 'absolute', bottom: 30, color: '#aaa', fontSize: 12 }
});