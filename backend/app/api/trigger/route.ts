import { NextResponse } from 'next/server';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS?.replace(/\s+/g, ''),
  },
});

export async function POST(request: Request) {
  const startTime = Date.now();
  let alertId: number | null = null;

  try {
    const body = await request.json();
    const { userId, location, floor } = body;
    
    if (!location) return NextResponse.json({ error: 'No location' }, { status: 400 });

    const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    const floorText = floor !== null && floor !== undefined ? `Floor ${floor}` : 'Floor unknown';
    
    // 1. LOG THE ATTEMPT IMMEDIATELY
    const { data: alertRecord, error: insertError } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        latitude: location.lat,
        longitude: location.lng,
        floor: floor,
        status: 'pending',
        channels_used: []
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to log alert:', insertError);
    } else {
      alertId = alertRecord.id;
      console.log('🚨 Alert logged with ID:', alertId);
    }

    console.log("🚨 ALERT TRIGGERED! Dispatching...");

    const mailOptions = {
      from: `"Emerlert Security" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: "🚨 SOS: PANIC BUTTON PRESSED",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #ef4444; border-radius: 10px; background-color: #fff1f2;">
          <h1 style="color: #ef4444; margin-top: 0;">🚨 EMERGENCY ALERT</h1>
          <p style="font-size: 16px;">The Panic Button was triggered.</p>
          
          <div style="margin: 20px 0;">
            <p><strong>Lat:</strong> ${location.lat}</p>
            <p><strong>Lng:</strong> ${location.lng}</p>
            <p><strong>Estimated Floor:</strong> ${floorText}</p>
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

    const voiceScript = `
      <Response>
        <Say voice="alice" language="en-US">
          Emergency Alert. 
          The panic button was triggered.
          Estimated location: ${floorText}.
          Please check your email immediately for the location map.
          Repeating. Check your email for location data.
        </Say>
      </Response>
    `;

    // 2. TRY TO SEND BOTH CHANNELS
    const channelsUsed: string[] = [];
    let errorMessage: string | null = null;

    const results = await Promise.allSettled([
      transporter.sendMail(mailOptions),
      twilioClient.calls.create({
        twiml: voiceScript,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: process.env.MY_PHONE_NUMBER!,
      })
    ]);

    // Check email result
    if (results[0].status === 'fulfilled') {
      channelsUsed.push('email');
      console.log("✅ Email Sent ID:", results[0].value.messageId);
    } else {
      errorMessage = `Email failed: ${results[0].reason}`;
      console.error("❌ Email Failed:", results[0].reason);
    }

    // Check call result
    if (results[1].status === 'fulfilled') {
      channelsUsed.push('voice');
      console.log("✅ Call Started SID:", results[1].value.sid);
    } else {
      errorMessage = errorMessage 
        ? `${errorMessage}; Voice failed: ${results[1].reason}`
        : `Voice failed: ${results[1].reason}`;
      console.error("❌ Call Failed:", results[1].reason);
    }

    // 3. UPDATE THE LOG WITH RESULTS
    const finalStatus = channelsUsed.length > 0 ? 'success' : 'failed';
    
    if (alertId) {
      await supabase
        .from('alerts')
        .update({
          status: finalStatus,
          channels_used: channelsUsed,
          error_message: errorMessage
        })
        .eq('id', alertId);
    }

    const duration = Date.now() - startTime;
    console.log(`⏱️ Alert completed in ${duration}ms with status: ${finalStatus}`);

    return NextResponse.json({ 
      success: channelsUsed.length > 0,
      alertId,
      channelsUsed,
      duration
    });

  } catch (error) {
    console.error("Dispatch Error:", error);
    
    // Log the failure
    if (alertId) {
      await supabase
        .from('alerts')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', alertId);
    }
    
    return NextResponse.json({ error: 'Failed to dispatch' }, { status: 500 });
  }
}