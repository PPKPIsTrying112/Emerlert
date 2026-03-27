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

    // 1. LOG THE ATTEMPT
    const { data: alertRecord, error: insertError } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        latitude: location.lat,
        longitude: location.lng,
        floor,
        status: 'pending',
        channels_used: []
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to log alert:', insertError);
    } else {
      alertId = alertRecord.id;
      console.log('Alert logged with ID:', alertId);
    }

    // 2. FETCH EMERGENCY CONTACTS
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId);

    if (contactsError) console.error('Failed to fetch contacts:', contactsError);

    // Fall back to env variables if no contacts saved yet
    const phoneNumbers = contacts && contacts.length > 0
      ? contacts.map((c: any) => c.phone)
      : [process.env.MY_PHONE_NUMBER!];

    const emailTo = process.env.GMAIL_USER!;

    console.log(`Alerting ${phoneNumbers.length} contact(s)...`);

    // 3. DISPATCH TO ALL CONTACTS
    const channelsUsed: string[] = [];
    let errorMessage: string | null = null;

    const mailOptions = {
      from: `"Emerlert Security" <${process.env.GMAIL_USER}>`,
      to: emailTo,
      subject: "SOS: PANIC BUTTON PRESSED",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #ef4444; border-radius: 10px; background-color: #fff1f2;">
          <h1 style="color: #ef4444; margin-top: 0;">EMERGENCY ALERT</h1>
          <p style="font-size: 16px;">The Panic Button was triggered.</p>
          <div style="margin: 20px 0;">
            <p><strong>Lat:</strong> ${location.lat}</p>
            <p><strong>Lng:</strong> ${location.lng}</p>
            <p><strong>Estimated Floor:</strong> ${floorText}</p>
          </div>
          <a href="${mapLink}" style="background-color: #ef4444; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            OPEN LIVE LOCATION
          </a>
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

    // Send email + calls to all contacts in parallel
    const callPromises = phoneNumbers.map(phone =>
      twilioClient.calls.create({
        twiml: voiceScript,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: phone,
      })
    );

    const results = await Promise.allSettled([
      transporter.sendMail(mailOptions),
      ...callPromises
    ]);

    // Check email
    if (results[0].status === 'fulfilled') {
      channelsUsed.push('email');
      console.log('Email sent');
    } else {
      errorMessage = `Email failed: ${results[0].reason}`;
      console.error('Email failed:', results[0].reason);
    }

    // Check calls
    results.slice(1).forEach((result, i) => {
      if (result.status === 'fulfilled') {
        channelsUsed.push(`voice:${phoneNumbers[i]}`);
        console.log(`Call started for ${phoneNumbers[i]}`);
      } else {
        console.error(`Call failed for ${phoneNumbers[i]}:`, result.reason);
      }
    });

    // 4. UPDATE LOG
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
    console.log(`Alert completed in ${duration}ms — ${phoneNumbers.length} contact(s) alerted`);

    return NextResponse.json({
      success: channelsUsed.length > 0,
      alertId,
      channelsUsed,
      contactsAlerted: phoneNumbers.length,
      duration
    });

  } catch (error) {
    console.error('Dispatch Error:', error);

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