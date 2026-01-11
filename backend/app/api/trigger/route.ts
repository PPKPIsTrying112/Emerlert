import { NextResponse } from 'next/server';

// This function handles "POST" requests (Sending data)
export async function POST(request: Request) {
  try {
    // 1. Read the incoming note (JSON)
    const body = await request.json();
    const { userId, location } = body;

    // 2. Validate the data (Security)
    if (!userId || !location) {
      return NextResponse.json(
        { error: 'Missing userId or location' }, 
        { status: 400 } // Bad Request
      );
    }

    // 3. The "Action" (For now, just log it)
    console.log("🚨 ALERT RECEIVED:");
    console.log(`- User: ${userId}`);
    console.log(`- Location: ${location.lat}, ${location.lng}`);

    // 4. Return Success (200 OK)
    // The mobile app waits for this "True" to show the Green Checkmark
    return NextResponse.json({ success: true, timestamp: new Date() });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// This function handles "GET" requests (Checking status)
// Try this in your browser: http://localhost:3000/api/trigger
export async function GET() {
  return NextResponse.json({ status: 'System Operational' });
}