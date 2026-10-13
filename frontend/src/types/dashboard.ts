export type AqiCategory = 
  | 'Good' 
  | 'Satisfactory' 
  | 'Moderate' 
  | 'Poor' 
  | 'Very Poor' 
  | 'Severe';

export interface PollutantMeasurement {
  code: 'PM2.5' | 'PM10' | 'NO2' | 'SO2' | 'CO' | 'O3' | 'NH3';
  name: string;
  value: number;
  unit: string;
  standardLimit: number; // 24h Indian CPCB standard threshold
  subIndex?: number;
}

export interface MonitoringStation {
  id: string;
  name: string;
  area: string;
  wardName: string;
  wardNumber: number;
  latitude: number;
  longitude: number;
  currentAqi: number;
  category: AqiCategory;
  dominantPollutant: string;
  pollutants: Record<string, PollutantMeasurement>;
  lastUpdated: string;
  source: 'CPCB' | 'KSPCB' | 'OpenAQ' | 'Simulated Hyperlocal';
  isSimulated: boolean;
  simulationNote?: string;
  status: 'active' | 'maintenance' | 'offline';
  temperatureC?: number;
  humidityPct?: number;
  windSpeedKmh?: number;
  windDirectionDeg?: number;
}

export interface AqiSummaryMetric {
  title: string;
  value: string | number;
  unit?: string;
  subtext: string;
  category?: AqiCategory;
  trendPct: number;
  trendDirection: 'up' | 'down' | 'neutral';
  trendIsGood: boolean;
  historySparkline: number[];
  isSimulated: true;
}

export interface AqiTimeSeriesPoint {
  timestamp: string;
  timeLabel: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
}

export interface ForecastPoint {
  timeLabel: string;
  hour: string;
  date: string;
  rawCamsAqi: number;
  correctedAqi: number;
  lowerConfidence: number;
  upperConfidence: number;
  category: AqiCategory;
  windSpeedKmh: number;
  weatherCondition: string;
}

export interface EnvironmentalIndicator {
  id: string;
  title: string;
  category: 'Traffic Emissions' | 'Meteorology' | 'Biomass & Fires' | 'Industrial & Dust';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  confidenceLabel: 'High Model Confidence' | 'Moderate Evidence' | 'Preliminary Signal';
  confidencePct: number;
  explanation: string;
  keyMetric: string;
  hotspotArea: string;
  isSimulated: true;
}

export interface WardData {
  wardNumber: number;
  wardName: string;
  bbmpZone: string;
  averageAqi: number;
  category: AqiCategory;
  dominantSource: string;
  vulnerabilityScore: number; // 0 - 100
  populationEst: string;
  monitoringCoverage: 'High' | 'Medium' | 'Low' | 'Estimated';
  peakHourAqi: number;
}

export interface HealthGuidance {
  group: string;
  iconName: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  generalAdvisory: string;
  actionItems: string[];
}

export interface CleanRouteOption {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  routeType: 'Green Corridor' | 'Standard ORR Route';
  distanceKm: number;
  durationMinutes: number;
  averageAqi: number;
  exposureScore: number;
  exposureSavingsPct?: number;
  description: string;
}

export interface CitizenReport {
  id: string;
  timestamp: string;
  ward: string;
  category: 'Garbage Burning' | 'Construction Dust' | 'Heavy Vehicle Smoke' | 'Industrial Fugitive';
  description: string;
  status: 'Investigating' | 'Verified' | 'Forwarded to BBMP' | 'Resolved';
  coordinates: [number, number];
  isSimulated: true;
}
