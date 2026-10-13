import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DEMO_AQI_TIMESERIES_24H } from '../../data/demoData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AqiTrendChartProps {
  height?: number;
}

export const AqiTrendChart: React.FC<AqiTrendChartProps> = ({ height = 260 }) => {
  const labels = DEMO_AQI_TIMESERIES_24H.map(d => d.timeLabel);
  const aqiData = DEMO_AQI_TIMESERIES_24H.map(d => d.aqi);
  const pm25Data = DEMO_AQI_TIMESERIES_24H.map(d => d.pm25);
  const pm10Data = DEMO_AQI_TIMESERIES_24H.map(d => d.pm10);

  const data = {
    labels,
    datasets: [
      {
        label: 'Overall AQI (Index)',
        data: aqiData,
        borderColor: '#238636',
        backgroundColor: 'rgba(35, 134, 54, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.4,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: '#238636',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2
      },
      {
        label: 'PM2.5 (µg/m³)',
        data: pm25Data,
        borderColor: '#55B86A',
        backgroundColor: 'transparent',
        borderDash: [4, 4],
        tension: 0.35,
        borderWidth: 1.8,
        pointRadius: 1.5,
        pointHoverRadius: 5,
        pointBackgroundColor: '#55B86A'
      },
      {
        label: 'PM10 (µg/m³)',
        data: pm10Data,
        borderColor: '#8C948E',
        backgroundColor: 'transparent',
        borderDash: [2, 2],
        tension: 0.35,
        borderWidth: 1.5,
        pointRadius: 1,
        pointHoverRadius: 4,
        pointBackgroundColor: '#8C948E'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#737B75',
          font: {
            size: 11,
            family: 'Inter, sans-serif',
            weight: 500
          },
          boxWidth: 12,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#171B18',
        bodyColor: '#171B18',
        borderColor: '#E5EAE5',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        callbacks: {
          label: (context: { dataset: { label?: string }; raw: unknown }) => {
            return ` ${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(23, 27, 24, 0.05)'
        },
        ticks: {
          color: '#737B75',
          font: {
            size: 10
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12
        }
      },
      y: {
        grid: {
          color: 'rgba(23, 27, 24, 0.05)'
        },
        ticks: {
          color: '#737B75',
          font: {
            size: 10
          }
        },
        suggestedMin: 30,
        suggestedMax: 180
      }
    }
  };

  return (
    <div className="card-base" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header-row" style={{ marginBottom: '0.5rem' }}>
        <div>
          <h3 className="card-title">
            24-Hour Diurnal AQI Trend Profile
          </h3>
          <span className="card-subtitle">
            Hourly progression showing morning rush peak (09:00) and evening boundary layer compression
          </span>
        </div>
        <span className="badge-demo">
          SIMULATED SERIES
        </span>
      </div>

      <div style={{ flex: 1, minHeight: `${height}px`, position: 'relative' }}>
        <Line data={data} options={options} />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '0.5rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.72rem',
        color: 'var(--text-secondary)'
      }}>
        <span>Peak: 168 AQI at 09:00 IST • Min: 108 AQI at 14:00 IST</span>
        <span style={{ fontWeight: 600 }}>Units: Index / µg/m³</span>
      </div>
    </div>
  );
};
