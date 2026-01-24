import { NextResponse } from 'next/server';
import twilio from 'twilio';
import nodemailer from 'nodemailer';

// 1. Initialize Twilio (For the VOICE CALL)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 2. Initialize Email Transporter (For the DATA)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS?.replace(/\s+/g, ''), // Auto-removes spaces from the key
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { location } = body;
    
    // Safety Check
    if (!location) return NextResponse.json({ error: 'No location' }, { status: 400 });

    // ✅ Google Maps Link
    const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    
    console.log("🚨 ALERT TRIGGERED! Dispatching Hybrid Alert...");

    // -------------------------------------------------------
    // A. SEND EMAIL (Replaces SMS)
    // -------------------------------------------------------
    const mailOptions = {
      from: `"Emerlert Security" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Sending to YOURSELF for the demo
      subject: "🚨 SOS: PANIC BUTTON PRESSED",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #ef4444; border-radius: 10px; background-color: #fff1f2;">
          <h1 style="color: #ef4444; margin-top: 0;">🚨 EMERGENCY ALERT</h1>
          <p style="font-size: 16px;">The Panic Button was triggered.</p>
          
          <div style="margin: 20px 0;">
            <p><strong>Lat:</strong> ${location.lat}</p>
            <p><strong>Lng:</strong> ${location.lng}</p>
          </div>

          <a href="${mapLink}" style="background-color: #ef4444; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            📍 OPEN LIVE LOCATION
          </a>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Sent automatically by Emerlert System.
          </p>
        </div>
      `,
    };

    // -------------------------------------------------------
    // B. MAKE VOICE CALL (The "Wake Up")
    // -------------------------------------------------------
    const voiceScript = `
      <Response>
        <Say voice="alice" language="en-US">
          Emergency Alert. 
          The panic button was triggered.
          Please check your email immediately for the location map.
          Repeating. Check your email for location data.
        </Say>
      </Response>
    `;

    // Execute both in parallel (Faster!)
    const [emailInfo, callInfo] = await Promise.all([
      transporter.sendMail(mailOptions),
      twilioClient.calls.create({
        twiml: voiceScript,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: process.env.MY_PHONE_NUMBER!,
      })
    ]);

    console.log("✅ Email Sent ID:", emailInfo.messageId);
    console.log("✅ Call Started SID:", callInfo.sid);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Dispatch Error:", error);
    return NextResponse.json({ error: 'Failed to dispatch' }, { status: 500 });
  }
}