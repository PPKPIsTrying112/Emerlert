# Emergency Alert System

A full-stack mobile application designed to trigger rapid emergency communications. The app captures real-time GPS data and utilizes server-side logic to dispatch automated voice calls (Text-to-Speech) and SMS messages to designated emergency contacts.

## Tech Stack

* **Mobile:** React Native (TypeScript)
* **Backend:** Next.js (API Routes)
* **Database:** PostgreSQL (via Supabase)
* **Telephony:** Twilio API (Voice & SMS)
* **Location:** Google Maps API (Reverse Geocoding)

## Architecture & Flow

1.  **Trigger:** User activates the "Panic Button" in the mobile app.
2.  **Payload:** App captures GPS (`lat`, `long`) and sends a secured `POST` request to the Next.js server.
3.  **Process:**
    * Server authenticates the user.
    * Converts coordinates to a human-readable address (Reverse Geocoding).
    * Fetches emergency contacts from PostgreSQL.
4.  **Dispatch:**
    * **Voice:** Initiates a Twilio call. When answered, a TTS (Text-to-Speech) engine reads the dynamic location script.
    * **SMS:** Sends a text with a Google Maps link.

## Getting Started

### Prerequisites
You will need API keys for the following services:
* **Twilio:** Account SID, Auth Token, and a verified phone number.
* **Google Maps Platform:** Geocoding API key.
* **PostgreSQL:** Connection string (e.g., Supabase URL).

### 1. Backend Setup (Next.js)

```bash
# Clone the repo
git clone [https://github.com/YOUR_USERNAME/REPO_NAME.git](https://github.com/YOUR_USERNAME/REPO_NAME.git)
cd REPO_NAME/backend

# Install dependencies
npm install

# Setup Environment Variables
# Create a .env.local file with:
DATABASE_URL=postgresql://...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
GOOGLE_MAPS_API_KEY=...

# Run the server
npm run dev
