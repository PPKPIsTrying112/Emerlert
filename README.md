# Emerlert (Emergency + Alert)

It's 11pm. You are all alone in an alley. Coming back home from work. You are scared and you start to overthink. *"What if someone sneaks behind my back? What's my escape plan? Am I supposed to pull out my phone and push some buttons to ask for help?"*
And this is what actually happens. First you unlock your phone. Then you navigate to your dial pad. You dial 911. You wait for dispatch to pick up (the benchmark is 15 seconds, but that's just the answer time and call *processing* alone averages 75–90 seconds). Then you have to verbally explain your emergency, give your location, and wait for units to be dispatched. Average police response after all that? Roughly 10 minutes, and that's for high-priority calls. And that's assuming you could even get the words out clearly. Under acute stress, once your heart rate exceeds 115 bpm your body begins losing fine motor control which is what you need to navigate a screen, dial digits, and type an address while shaking. Your brain is literally working against you.

This is where Emerlert comes in. One tap. That's it. The app immediately captures your precise GPS location and floor level, calls your emergency contacts with an automated voice readout of exactly where you are, and sends them an email with a live Google Maps link all at the same time and in under 50ms of perceived latency. No talking. No typing. No navigating menus. One tap while everything else happens for you during your distress. 

## Overview

Users can trigger an emergency alert with a single tap. The app automatically:
- Captures precise GPS coordinates (latitude/longitude)
- **Estimates floor level** using barometric pressure sensor + weather data
- Initiates voice calls with automated location readout
- Sends HTML email alerts with Google Maps link and floor information
- Provides optimistic UI feedback (<50ms perceived latency)

## Tech Stack

### Frontend
- **React Native** (TypeScript) - Cross-platform mobile (iOS + Android)
- **Expo** - Development platform and sensor access
- **expo-location** - GPS tracking
- **expo-sensors** - Barometer for floor detection

### Backend
- **Next.js** - API Routes (serverless functions)
- **PostgreSQL** (Planned via Supabase) - User data and alert logs
- **TypeScript** - Type-safe development

### Third-Party Services
- **Twilio** - Voice calls (Text-to-Speech). Chosen for its reliability and programmable voice API — a voice call carries more urgency and information density than a text, and Twilio's TTS handles the location readout without requiring the user to record anything.
- **Nodemailer (Gmail SMTP)** - Email delivery for the map link and floor data. Gmail SMTP keeps the barrier to entry low for a prototype; the plan is to migrate to SendGrid for production-level deliverability.
- **OpenWeatherMap API** - Real-time sea-level pressure data, which is the reference point the floor algorithm needs to be accurate regardless of weather conditions.
- **Open Elevation API** - Ground elevation to separate building height from terrain height in the floor calculation.

## Key Features

### Current Implementation
- **Optimistic UI** - Instant visual feedback on emergency trigger
- **GPS Location Tracking** - Real-time latitude/longitude capture
- **Floor Detection** - Barometric pressure + altitude calculation
- **Voice Calls** - Twilio TTS with location details
- **Email Alerts** - HTML formatted with map link and floor info
- **Deep Linking** - Siri Shortcuts integration
- **Parallel Dispatch** - Email + call sent simultaneously

### Planned Features
- SMS → Voice failover system
- Alert logging to PostgreSQL
- Row-Level Security (RLS) for data isolation
- Emergency contact management
- Live location tracking link
- User calibration for floor accuracy

## Architecture

```
┌─────────────────────┐
│   React Native      │
│   Mobile App        │
│  ┌──────────────┐   │
│  │ Barometer    │   │
│  │ GPS Sensor   │   │
│  └──────┬───────┘   │
└─────────┼───────────┘
          │
          ▼
┌─────────────────────┐
│   Next.js Backend   │
│   (API Routes)      │
└─────────┬───────────┘
          │
     ┌────┴─────┐
     │          │
┌────▼────┐ ┌──▼──────────┐
│ Twilio  │ │ External    │
│ Voice   │ │ APIs        │
│         │ │ - Weather   │
│ Gmail   │ │ - Elevation │
│ SMTP    │ │             │
└─────────┘ └─────────────┘
```

## Floor Detection Algorithm

GPS alone can't tell you what floor you're on as vertical accuracy from satellite signals is too coarse for that. Barometric pressure changes measurably with altitude, so by combining the phone's pressure sensor with the current sea-level reference from OpenWeatherMap and the ground elevation from Open Elevation, we can isolate the height above ground and convert it to an estimated floor. It's accurate to ±1–2 floors, which is enough to tell first responders whether you're on the ground level or the 8th floor of a building.

```
1. Barometer → Current air pressure (hPa)
2. GPS → Latitude/Longitude
3. OpenWeatherMap API → Sea-level pressure reference
4. Open Elevation API → Ground elevation (meters)
5. Formula: altitude = 44330 × (1 - (pressure / seaLevelPressure)^0.1903)
6. Height in building = altitude - ground elevation
7. Estimated floor = height ÷ 3.5m (average floor height)
```

## Database Schema (PostgreSQL)

### Users
- `id`, `email`, `phone`, `created_at`

### Emergency Contacts
- `id`, `user_id`, `name`, `phone`, `relationship`

### Alert Logs
- `id`, `user_id`, `timestamp`, `location_lat`, `location_lng`, `floor`, `status`, `channels_used`

### Alert Settings
- `id`, `user_id`, `message_template`, `trigger_type`, `floor_calibration_offset`

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or physical iPhone (barometer required)
- Twilio account
- OpenWeatherMap API key (free tier)
- Gmail account (for SMTP)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/emerlert.git
cd emerlert
```

**2. Backend Setup**
```bash
cd backend
npm install
npm run dev  # Runs on http://localhost:3000
```

**3. Mobile Setup**
```bash
cd mobile
npm install
npx expo start
```

**4. Update IP Address**
In `mobile/App.tsx`, update the backend URL:
```typescript
const response = await fetch('http://YOUR_LOCAL_IP:3000/api/trigger', {
```

## API Endpoints

### POST `/api/trigger`
Triggers emergency alert with location and floor data.

**Request:**
```json
{
  "userId": "demo_user",
  "location": {
    "lat": 34.0432,
    "lng": -118.4517
  },
  "floor": 2
}
```

**Response:**
```json
{
  "success": true
}
```

### POST `/api/calculate-floor`
Calculates floor estimate from barometer reading.

**Request:**
```json
{
  "lat": 34.0432,
  "lng": -118.4517,
  "pressure": 1013.25
}
```

**Response:**
```json
{
  "floor": 2,
  "details": {
    "seaLevelPressure": 1018,
    "groundElevation": 68,
    "currentAltitude": 73.33,
    "heightInBuilding": 5.33
  }
}
```

## Known Issues & Limitations

- Floor detection accuracy ±1-2 floors (depends on weather, building construction)
- Gmail SMTP may hit rate limits at scale — SendGrid recommended for production
- Twilio free trial limits voice call duration
- Open Elevation API can be slow (~1s response time)

## License

MIT

