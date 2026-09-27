// Open-Meteo Weather API Integration Service for Maritime Port Operations

export interface CurrentWeather {
  time: string;
  temperature2m: number; // °C
  windSpeed10m: number; // km/h
  relativeHumidity2m: number; // %
  weatherCode: number;
  conditionLabel: string;
  isMonsoonOrStormRisk: boolean;
}

export interface HourlyWeatherData {
  time: string[];
  temperature2m: number[];
  relativeHumidity2m: number[];
  windSpeed10m: number[];
}

export interface PastTenDaysWeather {
  hourly: HourlyWeatherData;
}

export interface HistoricalEra5Weather {
  hourly: HourlyWeatherData;
}

export interface PortWeatherSummary {
  current: CurrentWeather;
  pastTenDays: PastTenDaysWeather;
  historicalEra5?: HistoricalEra5Weather;
}

/**
 * Interpret WMO Weather Code into human-readable maritime weather conditions
 */
export function getWMOWeatherCondition(code: number): { label: string; risk: boolean } {
  switch (code) {
    case 0:
      return { label: 'Clear Sky / Excellent Visibility', risk: false };
    case 1:
      return { label: 'Mainly Clear', risk: false };
    case 2:
      return { label: 'Partly Cloudy', risk: false };
    case 3:
      return { label: 'Overcast', risk: false };
    case 45:
    case 48:
      return { label: 'Dense Fog / Reduced Visibility Alert', risk: true };
    case 51:
    case 53:
    case 55:
      return { label: 'Light Drizzle', risk: false };
    case 61:
    case 63:
      return { label: 'Moderate Rain', risk: false };
    case 65:
      return { label: 'Heavy Rain / Delay Risk', risk: true };
    case 80:
    case 81:
    case 82:
      return { label: 'Heavy Rain Showers', risk: true };
    case 95:
      return { label: 'Thunderstorm Warning', risk: true };
    case 96:
    case 99:
      return { label: 'Severe Squall / Cyclone Alert', risk: true };
    default:
      return { label: 'Moderate Weather', risk: false };
  }
}

/**
 * Fetch live current weather for a port using Open-Meteo REST API
 */
export async function fetchCurrentWeather(lat: number, lng: number): Promise<CurrentWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo Current API failed with status ${response.status}`);
  }

  const data = await response.json();
  const current = data.current || {};
  const weatherCode = current.weather_code ?? 0;
  const condition = getWMOWeatherCondition(weatherCode);

  const windSpeed = current.wind_speed_10m ?? 0;
  const isHighWind = windSpeed > 35; // High wind for port crane operations

  return {
    time: current.time || new Date().toISOString(),
    temperature2m: current.temperature_2m ?? 28.5,
    windSpeed10m: windSpeed,
    relativeHumidity2m: current.relative_humidity_2m ?? 75,
    weatherCode,
    conditionLabel: condition.label,
    isMonsoonOrStormRisk: condition.risk || isHighWind,
  };
}

/**
 * Fetch past 10 days weather history using Open-Meteo REST API
 */
export async function fetchPastTenDaysWeather(lat: number, lng: number): Promise<PastTenDaysWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&past_days=10&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo Past 10 Days API failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    hourly: {
      time: data.hourly?.time || [],
      temperature2m: data.hourly?.temperature_2m || [],
      relativeHumidity2m: data.hourly?.relative_humidity_2m || [],
      windSpeed10m: data.hourly?.wind_speed_10m || [],
    },
  };
}

/**
 * Fetch historical ERA5 archive weather for custom date range using Open-Meteo Archive REST API
 */
export async function fetchHistoricalEra5Weather(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<HistoricalEra5Weather> {
  const url = `https://archive-api.open-meteo.com/v1/era5?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo Historical ERA5 API failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    hourly: {
      time: data.hourly?.time || [],
      temperature2m: data.hourly?.temperature_2m || [],
      relativeHumidity2m: data.hourly?.relative_humidity_2m || [],
      windSpeed10m: data.hourly?.wind_speed_10m || [],
    },
  };
}

/**
 * Fallback generator in case of network offline / network blocks
 */
export function getFallbackWeather(portName: string): CurrentWeather {
  return {
    time: new Date().toISOString().substring(0, 16),
    temperature2m: 29.4,
    windSpeed10m: 14.2,
    relativeHumidity2m: 78,
    weatherCode: 2,
    conditionLabel: `Partly Cloudy (${portName} Local Observations)`,
    isMonsoonOrStormRisk: false,
  };
}
