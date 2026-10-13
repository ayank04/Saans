import type { MonitoringStation, PollutantMeasurement, AqiCategory } from '../types/dashboard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface ApiPollutantReading {
  code: string;
  value: number;
  unit: string;
  observation_timestamp: string;
}

export interface ApiStation {
  id: string;
  name: string;
  source: string;
  latitude: number | null;
  longitude: number | null;
  pollutants: Record<string, ApiPollutantReading>;
  last_updated: string | null;
  is_active: boolean;
  is_live: boolean;
}

export interface ApiStationListResponse {
  total: number;
  stations: ApiStation[];
  source: string;
  is_live: boolean;
  latest_ingestion_time?: string | null;
  latest_observation_time?: string | null;
  data_freshness_status?: 'fresh' | 'stale' | 'outdated' | 'unavailable';
  is_stale?: boolean;
}

export interface FetchStationsResult {
  stations: MonitoringStation[];
  isLive: boolean;
  total: number;
  source: string;
  rawTimestamp?: string;
  latestIngestionTime?: string;
  dataFreshnessStatus?: 'fresh' | 'stale' | 'outdated' | 'unavailable';
  isStale?: boolean;
  error?: string;
}

export interface IngestionStatusData {
  source: string;
  latest_observation_time: string | null;
  latest_ingestion_time: string | null;
  observation_age_hours: number | null;
  staleness_threshold_hours: number;
  freshness_status: 'fresh' | 'stale' | 'outdated' | 'unavailable';
  is_stale: boolean;
  scheduler: {
    enabled: boolean;
    interval_seconds: number;
    last_run_status: string;
    last_run_started: string | null;
    last_run_completed: string | null;
    last_records_inserted: number;
    last_records_skipped: number;
  };
}

/**
 * Calculate Indian National Air Quality Index (NAQI) sub-index for PM2.5 (24h avg)
 */
function calculatePm25SubIndex(pm25: number): number {
  if (pm25 <= 30) return Math.round((50 / 30) * pm25);
  if (pm25 <= 60) return Math.round(50 + ((50 / 30) * (pm25 - 30)));
  if (pm25 <= 90) return Math.round(100 + ((100 / 30) * (pm25 - 60)));
  if (pm25 <= 120) return Math.round(200 + ((100 / 30) * (pm25 - 90)));
  if (pm25 <= 250) return Math.round(300 + ((100 / 130) * (pm25 - 120)));
  return Math.min(500, Math.round(400 + ((100 / 150) * (pm25 - 250))));
}

/**
 * Calculate Indian National Air Quality Index (NAQI) sub-index for PM10 (24h avg)
 */
function calculatePm10SubIndex(pm10: number): number {
  if (pm10 <= 50) return Math.round(pm10);
  if (pm10 <= 100) return Math.round(50 + ((50 / 50) * (pm10 - 50)));
  if (pm10 <= 250) return Math.round(100 + ((100 / 150) * (pm10 - 100)));
  if (pm10 <= 350) return Math.round(200 + ((100 / 100) * (pm10 - 250)));
  if (pm10 <= 430) return Math.round(300 + ((100 / 80) * (pm10 - 350)));
  return Math.min(500, Math.round(400 + ((100 / 70) * (pm10 - 430))));
}

/**
 * Map AQI value to Indian CPCB category
 */
function getAqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

/**
 * Standard pollutant names and 24-hr CPCB thresholds
 */
const POLLUTANT_CONFIGS: Record<string, { name: string; limit: number }> = {
  'PM2.5': { name: 'Fine Particulate Matter (PM2.5)', limit: 60 },
  'PM10': { name: 'Coarse Particulate Matter (PM10)', limit: 100 },
  'NO2': { name: 'Nitrogen Dioxide (NO2)', limit: 80 },
  'SO2': { name: 'Sulphur Dioxide (SO2)', limit: 80 },
  'CO': { name: 'Carbon Monoxide (CO)', limit: 2 },
  'O3': { name: 'Ozone (O3)', limit: 100 },
  'NH3': { name: 'Ammonia (NH3)', limit: 400 },
};

/**
 * Format ISO or source timestamp to friendly display
 */
export function formatTimestamp(timestampStr: string | null): string {
  if (!timestampStr) return 'Recent';
  try {
    const d = new Date(timestampStr);
    if (isNaN(d.getTime())) return timestampStr;
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ' IST';
  } catch {
    return timestampStr;
  }
}

/**
 * Transform a backend API station to the frontend MonitoringStation interface
 */
export function transformApiStation(apiStation: ApiStation): MonitoringStation {
  const pollutantMeasurements: Record<string, PollutantMeasurement> = {};
  let calculatedAqi = 0;
  let dominantPollutant = 'PM2.5';
  let maxSubIndex = 0;

  for (const [code, r] of Object.entries(apiStation.pollutants)) {
    const cfg = POLLUTANT_CONFIGS[code] || { name: code, limit: 100 };
    let subIdx: number | undefined;

    if (code === 'PM2.5') {
      subIdx = calculatePm25SubIndex(r.value);
    } else if (code === 'PM10') {
      subIdx = calculatePm10SubIndex(r.value);
    }

    if (subIdx !== undefined && subIdx > maxSubIndex) {
      maxSubIndex = subIdx;
      calculatedAqi = subIdx;
      dominantPollutant = code;
    }

    pollutantMeasurements[code] = {
      code: code as any,
      name: cfg.name,
      value: r.value,
      unit: r.unit,
      standardLimit: cfg.limit,
      subIndex: subIdx,
    };
  }

  // If no PM subindex was calculated, fallback to first available or 50
  if (calculatedAqi === 0 && Object.keys(pollutantMeasurements).length > 0) {
    calculatedAqi = 65;
  }

  // Clean area name from station name
  const nameParts = apiStation.name.split(',');
  const area = nameParts[0].trim();
  const sourceName: 'CPCB' | 'KSPCB' | 'OpenAQ' = apiStation.name.toUpperCase().includes('KSPCB')
    ? 'KSPCB'
    : 'CPCB';

  return {
    id: apiStation.id,
    name: apiStation.name,
    area: area,
    wardName: `${area} Ward`,
    wardNumber: 0,
    latitude: apiStation.latitude ?? 12.9716,
    longitude: apiStation.longitude ?? 77.5946,
    currentAqi: calculatedAqi,
    category: getAqiCategory(calculatedAqi),
    dominantPollutant: dominantPollutant,
    pollutants: pollutantMeasurements,
    lastUpdated: formatTimestamp(apiStation.last_updated),
    source: sourceName,
    isSimulated: false,
    status: apiStation.is_active ? 'active' : 'offline',
  };
}

/**
 * Fetch live stations from backend API
 */
export async function fetchLiveStations(): Promise<FetchStationsResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/stations`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        stations: [],
        isLive: false,
        total: 0,
        source: 'backend_error',
        error: `Server responded with status ${response.status}`,
      };
    }

    const data: ApiStationListResponse = await response.json();

    if (!data.stations || data.stations.length === 0) {
      return {
        stations: [],
        isLive: false,
        total: 0,
        source: 'empty_response',
      };
    }

    const transformed = data.stations.map(transformApiStation);

    return {
      stations: transformed,
      isLive: true,
      total: data.total,
      source: data.source || 'cpcb_datagov',
      rawTimestamp: data.latest_observation_time || data.stations[0]?.last_updated || undefined,
      latestIngestionTime: data.latest_ingestion_time || undefined,
      dataFreshnessStatus: data.data_freshness_status || 'fresh',
      isStale: data.is_stale || false,
    };
  } catch (err: any) {
    return {
      stations: [],
      isLive: false,
      total: 0,
      source: 'network_error',
      error: err?.message || 'Failed to connect to backend',
    };
  }
}

/**
 * Fetch detailed ingestion and freshness status from backend
 */
export async function fetchIngestionStatus(): Promise<IngestionStatusData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/ingestion/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Manually trigger a CPCB ingestion run (backend throttles / locks prevent overlaps)
 */
export async function triggerManualIngestion(): Promise<{
  status: string;
  message: string;
  run_id?: number;
  records_fetched?: number;
  measurements_inserted?: number;
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/ingestion/trigger`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch {
    return null;
  }
}
