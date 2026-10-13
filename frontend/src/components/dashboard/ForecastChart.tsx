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
import { DEMO_FORECAST_POINTS } from '../../data/demoData';

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

interface ForecastChartProps {
  height?: number;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ height = 260 }) => {
  const labels = DEMO_FORECAST_POINTS.map(p => p.timeLabel);
  const rawCams = DEMO_FORECAST_POINTS.map(p => p.rawCamsAqi);
  const corrected = DEMO_FORECAST_POINTS.map(p => p.correctedAqi);
  const lowerConf = DEMO_FORECAST_POINTS.map(p => p.lowerConfidence);
  const upperConf = DEMO_FORECAST_POINTS.map(p => p.upperConfidence);

  const data = {
    labels,
    datasets: [
      {
        label: 'Upper Confidence (90% CI)',
        data: upperConf,
        borderColor: 'transparent',
        backgroundColor: 'rgba(35, 134, 54, 0.08)',
        fill: '+1',
        pointRadius: 0,
        tension: 0.35
      },
      {
        label: 'Lower Confidence (90% CI)',
        data: lowerConf,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        pointRadius: 0,
        tension: 0.35
      },
      {
        label: 'SAANS Illustrative Bias-Adjusted Forecast',
        data: corrected,
        borderColor: '#238636',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#238636',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5,
        tension: 0.35
      },
      {
        label: 'Raw Global CAMS Model (Benchmark)',
        data: rawCams,
        borderColor: '#737B75',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        borderWidth: 1.8,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#737B75',
        tension: 0.35
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
          usePointStyle: true,
          filter: (item: { text: string }) => !item.text.includes('Confidence')
        }
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#171B18',
        bodyColor: '#171B18',
        borderColor: '#E5EAE5',
        borderWidth: 1,
        padding: 10,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        callbacks: {
          afterTitle: (items: Array<{ dataIndex: number }>) => {
            const idx = items[0]?.dataIndex;
            if (idx !== undefined && DEMO_FORECAST_POINTS[idx]) {
              const pt = DEMO_FORECAST_POINTS[idx];
              return `Condition: ${pt.weatherCondition} • Wind: ${pt.windSpeedKmh} km/h`;
            }
            return '';
          },
          label: (context: { dataset: { label?: string }; raw: unknown }) => {
            if (context.dataset.label?.includes('Confidence')) return '';
            return ` ${context.dataset.label}: ${context.raw} AQI`;
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
          maxTicksLimit: 8
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
        suggestedMin: 80,
        suggestedMax: 200
      }
    }
  };

  return (
    <div className="card-base" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header-row" style={{ marginBottom: '0.5rem' }}>
        <div>
          <h3 className="card-title">
            48-Hour Atmospheric Forecast vs Simulated Local Adjustment
          </h3>
          <span className="card-subtitle">
            Illustrative comparison between regional CAMS baseline and synthetic Bengaluru boundary-layer bias adjustments
          </span>
        </div>
        <span className="badge-demo">
          DEMO PROJECTION
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
        <span>Peak Expected: 182 AQI tomorrow 08:30 IST during morning inversion</span>
        <span style={{ fontWeight: 600 }}>Simulated Demonstration Curve</span>
      </div>
    </div>
  );
};
