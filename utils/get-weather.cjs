/**
 * get-weather.cjs
 *
 * Fetches historical/forecast weather for a specific date using Open-Meteo API.
 */

async function getWeather(date, locationStr = "Bingham, UK") {
  // Hardcoded coordinates for Bingham, UK for now (simplifies things for MVP)
  const lat = 52.95;
  const lon = -0.95;

  const dateStr = date.toISOString().split('T')[0];

  // Note: For past dates we might need archive endpoint, but forecast endpoint often works for recent past?
  // Open-Meteo archives are separate. Let's try forecast first as it covers recent days.
  // Actually, for "result" generation, we might be running this on the day of the run or slightly after.
  // "forecast" endpoint usually keeps recent history (up to past 2-3 months sometimes).

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&start_date=${dateStr}&end_date=${dateStr}&timezone=Europe%2FLondon`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();

    // WMO Weather interpretation codes (WW)
    // Code: Description
    const weatherEmojis = {
      0: '☀️ Clear',
      1: '🌤️ Mainly Clear',
      2: '⛅ Partly Cloudy',
      3: '☁️ Overcast',
      45: '🌫️ Foggy',
      48: '🌫️ Rime Fog',
      51: '🌧️ Light Drizzle',
      53: '🌧️ Drizzle',
      55: '🌧️ Heavy Drizzle',
      56: '🌧️ Freezing Drizzle',
      61: '🌧️ Light Rain',
      63: '🌧️ Rain',
      65: '🌧️ Heavy Rain',
      66: '🌧️ Freezing Rain',
      71: '🌨️ Light Snow',
      73: '🌨️ Snow',
      75: '🌨️ Heavy Snow',
      80: '🌧️ Showers',
      81: '🌧️ Heavy Showers',
      85: '🌨️ Snow Showers',
      95: '⛈️ Thunderstorm',
    };

    const code = data.daily?.weathercode?.[0];
    const maxTemp = data.daily?.temperature_2m_max?.[0];

    if (code === undefined || maxTemp === undefined) return null;

    const emojiDesc = weatherEmojis[code] || '🌤️';
    return `${emojiDesc} ${Math.round(maxTemp)}°C`;

  } catch (error) {
    console.warn(`Failed to fetch weather for ${dateStr}:`, error.message);
    return null;
  }
}

module.exports = { getWeather };
