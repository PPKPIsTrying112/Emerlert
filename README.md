# Emerlert (Emergency + Alert)

It's 11pm. You are all alone in an alley. Coming back home from work. You are scared and you start to overthink. *"What if someone sneaks behind my back? Tries to strangle me or whatever horror I can think of. What am I supposed to do to ask for help?"*

Our escape plan is probably to use our phone. But using our phone requires us to think. And thinking clearly is exactly what our body is sabotaging right now.

The moment real fear kicks in, your heart rate spikes past 115 bpm. At that point your body starts pulling blood away from your fingers and into your major organs. Your hands begin to shake. The fine motor control you need to unlock a screen, navigate to a dial pad, and punch in digits is gone. And when every second counts, that's the worst time to be fumbling.

And let's say you push through that and actually get 911 dialing. You're not done. Call processing alone averages 75 to 90 seconds before anyone is even dispatched. Then you wait. Average police response for a high-priority call? Around 10 minutes. That's 10 minutes of staying calm, staying hidden, staying on the line while everything in your body is screaming at you to run.

This is where my passion project comes in. Emerlert. Just one tap and help is on the way. The app captures your exact GPS location and floor level, calls your emergency contacts with an automated voice readout of exactly where you are, and sends them a Google Maps link all at the same time while you keep your eyes up and your head clear. No talking. No typing. No menus. Just one tap.

## Overview

Most emergency apps stop at a phone call or a text. Emerlert goes further. The part that makes it different is that your contacts don't just get notified that something is wrong. They get told exactly where you are, down to what floor of a building you're on, through an automated voice call and a Google Maps link, before you even have to say a single word.

The floor detection is the piece that took the most work to get right. GPS can tell you latitude and longitude but it has no idea if you're on the ground floor or the 12th. Emerlert solves that by reading your phone's barometric pressure sensor and cross referencing it with real time weather and elevation data to estimate your floor level. It's the same physics principle used in aviation altimeters, just applied to the inside of a building.

Everything fires in parallel the moment you tap. The call goes out. The email goes out. Your location is captured. All of it in under 50ms of perceived latency on your end so the app never feels like it's thinking while you're waiting.

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
- **Twilio** - Voice calls (Text-to-Speech). Chosen for its reliability and programmable voice API. A voice call carries more urgency and information density than a text, and Twilio's TTS handles the location readout without requiring the user to record anything.
- **Nodemailer (Gmail SMTP)** - Email delivery for the map link and floor data. Gmail SMTP keeps the barrier to entry low for a prototype with the plan to migrate to SendGrid for production level deliverability.
- **OpenWeatherMap API** - Real time sea-level pressure data, which is the reference point the floor algorithm needs to be accurate regardless of weather conditions.
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
- SMS to Voice failover system
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

GPS alone can't tell you what floor you're on as vertical accuracy from satellite signals is too coarse for that. Barometric pressure changes measurably with altitude, so by combining the phone's pressure sensor with the current sea-level reference from OpenWeatherMap and the ground elevation from Open Elevation, we can isolate the height above ground and convert it to an estimated floor. It's accurate to plus or minus 1 to 2 floors, which is enough to tell first responders whether you're on the ground level or the 8th floor of a building.

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

- Floor detection accuracy plus or minus 1 to 2 floors depending on weather and building construction
- Gmail SMTP may hit rate limits at scale and SendGrid is recommended for production
- Twilio free trial limits voice call duration
- Open Elevation API can be slow at around 1 second response time

## License

MIT
