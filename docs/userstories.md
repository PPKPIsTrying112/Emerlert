# 📋 User Stories & Acceptance Criteria

**Project:** Emergency Alert System
**Status:** MVP Phase
**Last Updated:** December 2025

---

## 🟢 Epic 1: The Mobile Client (React Native)

### Story 1.1: The Secure Trigger Mechanism
**As a** user in a high-stress situation,
**I want** to trigger the alert by pressing and holding a button for 3 seconds,
**So that** I do not send false alarms by accidentally tapping the screen.

**Acceptance Criteria:**
- [ ] A large, prominent button is visible on the Home Screen.
- [ ] Tapping the button (press < 3s) does **not** trigger the alert.
- [ ] Holding the button triggers a visual animation (e.g., a filling ring or color change).
- [ ] Releasing the button before 3 seconds resets the animation and cancels the action.
- [ ] Holding for the full 3 seconds triggers the "Alert Sent" state and vibrates the device.

### Story 1.2: GPS Location Capture
**As a** user,
**I want** the app to capture my precise latitude and longitude immediately upon triggering,
**So that** help can be sent to my exact location.

**Acceptance Criteria:**
- [ ] App requests "When In Use" location permissions on first launch.
- [ ] If permission is denied, a warning modal appears explaining why it is needed.
- [ ] On trigger, the app successfully retrieves `latitude` and `longitude`.
- [ ] If GPS signal is weak, the app falls back to the last known location (if available) or sends a "Location Unavailable" flag.

### Story 1.3: Manage Emergency Contacts
**As a** user setting up the app,
**I want** to save a contact's name and phone number,
**So that** the system knows who to notify in an emergency.

**Acceptance Criteria:**
- [ ] User can input a Name and Phone Number in a form.
- [ ] Input validates that the phone number format is correct (E.164 format, e.g., +15550001234).
- [ ] Clicking "Save" persists the data to the PostgreSQL database.
- [ ] The saved contact appears in a list on the Settings screen.
- [ ] User can delete a contact.

---

## 🔵 Epic 2: The Backend API (Next.js)

### Story 2.1: Alert Ingestion API
**As a** developer (system),
**I want** a secure API endpoint to receive trigger data,
**So that** the mobile app can offload the heavy logic to the server.

**Acceptance Criteria:**
- [ ] Endpoint `POST /api/trigger-alert` exists.
- [ ] Endpoint accepts a JSON payload: `{ userId, location: { lat, long } }`.
- [ ] Server verifies the `userId` exists in the database.
- [ ] Server returns a `200 OK` status to the mobile app immediately (before processing calls) to ensure UI responsiveness.
- [ ] Server logs the event timestamp in the `AlertLogs` table.

### Story 2.2: Reverse Geocoding Service
**As a** recipient of the alert,
**I want** to hear a street address instead of raw coordinates,
**So that** I understand where the user is immediately.

**Acceptance Criteria:**
- [ ] Server successfully calls Google Maps/Mapbox API with `lat/long`.
- [ ] API returns a readable address string (e.g., "123 Main St, New York").
- [ ] If Geocoding fails, the system defaults to "Unknown Address" but keeps raw coordinates in the payload.

---

## 🔴 Epic 3: Telephony Integration (Twilio)

### Story 3.1: Automated Voice Call (TTS)
**As a** emergency contact,
**I want** to receive a phone call that speaks the alert message,
**So that** I am notified even if I am sleeping or not looking at my texts.

**Acceptance Criteria:**
- [ ] System initiates a call to the saved contact number.
- [ ] When answered, a Text-to-Speech voice says: "Emergency Alert from [User Name]."
- [ ] The voice reads the current address found in Story 2.2.
- [ ] The voice repeats the message at least once.

### Story 3.2: SMS with Map Link
**As a** emergency contact,
**I want** to receive a text message with a clickable map link,
**So that** I can get turn-by-turn directions to the user.

**Acceptance Criteria:**
- [ ] System sends an SMS immediately after the voice call is initiated.
- [ ] SMS content includes: "HELP! [User Name] triggers an alert."
- [ ] SMS includes a valid Google Maps link: `https://www.google.com/maps/search/?api=1&query=LAT,LONG`.
- [ ] SMS is delivered within 10 seconds of the trigger.