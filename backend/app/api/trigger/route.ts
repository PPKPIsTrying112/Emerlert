import { NextResponse } from 'next/server';
import twilio from 'twilio';

// 1. Initialize the Twilio Client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { location } = body;
    
    // Safety Check
    if (!location) return NextResponse.json({ error: 'No location' }, { status: 400 });

    const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    
    // -------------------------------------------------------
    // A. SEND SMS (The "paper trail")
    // -------------------------------------------------------
    const sms = await client.messages.create({
      body: `🚨 EMERGENCY ALERT 🚨\nUser triggered SOS.\nLocation: ${mapLink}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.MY_PHONE_NUMBER!, // The person receiving the alert
    });
    console.log("✅ SMS Sent:", sms.sid);

    // -------------------------------------------------------
    // B. MAKE VOICE CALL (The "Wake Up" call)
    // -------------------------------------------------------
    // We construct the XML script here dynamically
    const voiceScript = `
      <Response>
        <Say voice="alice" language="en-US">
          This is an Emergency Alert. 
          The user has triggered the panic button.
          Their location is currently being tracked.
          Check your text messages for the GPS link.
          Repeating. This is an Emergency Alert.
        </Say>
      </Response>
    `;

    const call = await client.calls.create({
      twiml: voiceScript, // <--- We inject the script directly!
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.MY_PHONE_NUMBER!,
    });
    console.log("✅ Call Started:", call.sid);

    return NextResponse.json({ success: true, smsId: sms.sid, callId: call.sid });

  } catch (error) {
    console.error("Dispatch Error:", error);
    return NextResponse.json({ error: 'Failed to dispatch' }, { status: 500 });
  }
}