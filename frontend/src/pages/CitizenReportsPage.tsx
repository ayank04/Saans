import React, { useState } from 'react';
import { DEMO_CITIZEN_REPORTS, DEMO_WARDS } from '../data/demoData';
import type { CitizenReport } from '../types/dashboard';
import { Plus, CheckCircle2, Clock, MapPin, Send, Flame, Truck, Hammer, Building } from 'lucide-react';

export const CitizenReportsPage: React.FC = () => {
  const [reports, setReports] = useState<CitizenReport[]>(DEMO_CITIZEN_REPORTS);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [category, setCategory] = useState<CitizenReport['category']>('Garbage Burning');
  const [ward, setWard] = useState(DEMO_WARDS[0].wardName);
  const [description, setDescription] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newReport: CitizenReport = {
      id: `rep-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now (12 Oct 2026)',
      ward,
      category,
      description,
      status: 'Investigating',
      coordinates: [12.9716, 77.5946],
      isSimulated: true
    };

    setReports([newReport, ...reports]);
    setShowSubmitModal(false);
    setDescription('');
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
  };

  const getStatusStyle = (status: CitizenReport['status']) => {
    switch (status) {
      case 'Resolved': 
        return { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' };
      case 'Forwarded to BBMP': 
        return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
      case 'Verified': 
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      default: 
        return { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' };
    }
  };

  const getCategoryIcon = (cat: CitizenReport['category']) => {
    switch (cat) {
      case 'Garbage Burning': return Flame;
      case 'Heavy Vehicle Smoke': return Truck;
      case 'Construction Dust': return Hammer;
      default: return Building;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Hyperlocal Citizen Pollution Incident Reports
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Crowdsourced ground-truth verification of open waste burning, construction dust, and illegal vehicle emissions
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            <span>Submit Incident Report</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div style={{
          background: '#DCFCE7',
          border: '1px solid #BBF7D0',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          color: '#15803D',
          fontSize: '0.82rem'
        }}>
          <CheckCircle2 size={18} />
          <span>Report recorded in local demonstration queue. Assigned verification ID with geolocation tag.</span>
        </div>
      )}

      {/* Reports Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Recent Incident Log ({reports.length})
          </span>
          <span className="badge-demo">COMMUNITY FEED</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1rem'
        }}>
          {reports.map((rep) => {
            const Icon = getCategoryIcon(rep.category);
            const statusStyle = getStatusStyle(rep.status);

            return (
              <div
                key={rep.id}
                className="card-base card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.15rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'var(--bg-card-subtle)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-green)'
                      }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                          {rep.category}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {rep.ward}
                        </span>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.66rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`
                    }}>
                      {rep.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                    "{rep.description}"
                  </p>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} /> {rep.timestamp}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                    <MapPin size={12} /> {rep.coordinates[0].toFixed(2)}°, {rep.coordinates[1].toFixed(2)}°
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Report Modal (Light theme) */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(23, 27, 24, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="card-base modal-animate-enter" style={{ maxWidth: '500px', width: '100%', padding: '1.5rem', background: '#FFFFFF', boxShadow: 'var(--shadow-modal)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
              Report Pollution Anomaly
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Simulate submitting an environmental incident report to the SAANS triage dashboard.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
                  Incident Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CitizenReport['category'])}
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                >
                  <option value="Garbage Burning">Garbage / Leaf Burning</option>
                  <option value="Construction Dust">Uncontrolled Construction Dust</option>
                  <option value="Heavy Vehicle Smoke">Heavy Vehicle Exhaust Smoke</option>
                  <option value="Industrial Fugitive">Industrial Fugitive Emissions</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
                  BBMP Ward / Area
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                >
                  {DEMO_WARDS.map(w => (
                    <option key={w.wardNumber} value={w.wardName}>
                      {w.wardName} (Ward #{w.wardNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
                  Description & Observations
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe location details, smoke intensity, duration..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem',
                    fontSize: '0.82rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              </div>

              <div style={{
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.72rem',
                color: '#92400E'
              }}>
                Demonstration mode: Report will be added to the local session feed.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  <Send size={14} /> Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
