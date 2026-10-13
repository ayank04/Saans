import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { DEMO_POLLUTANT_COMPARISON } from '../../data/demoData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PollutantComparisonChartProps {
  height?: number;
}

export const PollutantComparisonChart: React.FC<PollutantComparisonChartProps> = ({ height = 260 }) => {
  const labels = DEMO_POLLUTANT_COMPARISON.map(p => p.code);
  const ratioData = DEMO_POLLUTANT_COMPARISON.map(p => p.ratioPct);
  
  // Clean green/amber/red indicator bars on white canvas
  const backgroundColors = DEMO_POLLUTANT_COMPARISON.map(p => 
    p.ratioPct > 100 
      ? '#dc2626' 
      : p.ratioPct > 80 
        ? '#d97706' 
        : '#238636'
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Observed vs 24h Standard Limit (%)',
        data: ratioData,
        backgroundColor: backgroundColors,
        borderRadius: 4,
        maxBarThickness: 36
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
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
          label: (context: { dataIndex: number }) => {
            const item = DEMO_POLLUTANT_COMPARISON[context.dataIndex];
            return [
              ` Observed: ${item.value} ${item.unit}`,
              ` CPCB 24h Limit: ${item.standardLimit} ${item.unit}`,
              ` Ratio: ${item.ratioPct}% (${item.status})`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#171B18',
          font: {
            size: 11,
            weight: 600
          }
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
          },
          callback: (value: unknown) => `${value}%`
        },
        suggestedMax: 140
      }
    }
  };

  return (
    <div className="card-base" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header-row" style={{ marginBottom: '0.5rem' }}>
        <div>
          <h3 className="card-title">
            Pollutant Concentration vs CPCB Permissible Standards
          </h3>
          <span className="card-subtitle">
            Normalized percentage against 24-hour National Ambient Air Quality Standards (CPCB 2009)
          </span>
        </div>
        <span className="badge-demo">
          SIMULATED RATIOS
        </span>
      </div>

      <div style={{ flex: 1, minHeight: `${height}px`, position: 'relative' }}>
        <Bar data={data} options={options} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#238636' }} /> &lt;80% Safe
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#d97706' }} /> 80-100% Near Limit
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#dc2626' }} /> &gt;100% Exceeded (PM10)
          </span>
        </div>
        <span style={{ fontWeight: 600 }}>Standard: CPCB 2009 (24h avg)</span>
      </div>
    </div>
  );
};
