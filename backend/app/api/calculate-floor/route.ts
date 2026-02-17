import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { lat, lng, pressure } = await request.json();

    if (!lat || !lng || !pressure) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. Get sea level pressure from OpenWeatherMap
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    const weatherData = await weatherResponse.json();
    const seaLevelPressure = weatherData.main.sea_level || weatherData.main.pressure;

    // 2. Get ground elevation
    const elevationResponse = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
    );
    const elevationData = await elevationResponse.json();
    const groundElevation = elevationData.results[0].elevation;

    // 3. Calculate altitude from pressure
    const currentAltitude = 44330 * (1 - Math.pow(pressure / seaLevelPressure, 0.1903));

    // 4. Height in building
    const heightInBuilding = currentAltitude - groundElevation;

    // 5. Floor estimate
        // With some calibration here so might need to fix in the future
    const floor = Math.max(0, Math.round(heightInBuilding / 3.5) - 2);

    // DEBUG LOGS
    console.log('🏢 FLOOR CALCULATION BREAKDOWN:');
    console.log('Sea Level Pressure:', seaLevelPressure, 'hPa');
    console.log('Ground Elevation:', groundElevation, 'm');
    console.log('Current Altitude:', currentAltitude, 'm');
    console.log('Height in Building:', heightInBuilding, 'm');
    console.log('Estimated Floor:', floor);

    return NextResponse.json({
      floor,
      details: {
        seaLevelPressure,
        groundElevation,
        currentAltitude,
        heightInBuilding
      }
    });

  } catch (error) {
    console.error('Floor calculation error:', error);
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
  }
}