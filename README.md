# Emergency Alert App (Emerlert)

A mobile emergency alert application that sends automated calls and email notifications to emergency contacts with real-time GPS location and floor-level precision.

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
- **Twilio** - Voice calls (Text-to-Speech)
- **Nodemailer (Gmail SMTP)** - Email delivery
- **OpenWeatherMap API** - Real-time sea-level pressure data
- **Open Elevation API** - Ground elevation for floor calculation

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

```
1. Barometer → Current air pressure (hPa)
2. GPS → Latitude/Longitude
3. OpenWeatherMap API → Sea-level pressure reference
4. Open Elevation API → Ground elevation (meters)
5. Formula: altitude = 44330 × (1 - (pressure / seaLevelPressure)^0.1903)
6. Height in building = altitude - ground elevation
7. Estimated floor = height ÷ 3.5m (average floor height)
```

## Database Schema (PostgreSQL - Planned)

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

### Environment Variables

**Backend (`/backend/.env.local`):**
```bash
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
MY_PHONE_NUMBER=+1234567890
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
OPENWEATHER_API_KEY=your_openweather_key
```

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

## Metrics (In Progress)

### Latency (Complete)
**Goal:** "<50ms perceived emergency trigger latency"
- Optimistic UI updates state immediately
- Background API processing doesn't block user feedback

### Reliability (In Progress)
**Goal:** "99.9% alert delivery rate with multi-channel failover"
- Needs: Alert logging + SMS → Voice fallback

### Scalability (Planned)
**Goal:** "Handles 50+ concurrent requests with <200ms response time"
- Needs: Load testing with Artillery.io

### Security (Planned)
**Goal:** "Row-Level Security for location data isolation"
- Needs: Supabase RLS implementation

## Known Issues & Limitations

- Floor detection accuracy ±1-2 floors (depends on weather, building construction)
- Gmail SMTP may hit rate limits (consider SendGrid for production)
- Twilio free trial limits voice call duration
- Open Elevation API can be slow (~1s response time)

## License

MIT
