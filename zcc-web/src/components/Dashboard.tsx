import React from 'react';
import { StatusBadge } from './StatusBadge';

interface Vendor {
  id: number;
  name: string;
  email: string;
  status: string;
  lastChecked: string;
  exceptions: number | null;
  history: any[];
  autoAssess?: boolean;
}

interface DashboardProps {
  vendors: Vendor[];
  setVendors: (vendors: Vendor[]) => void;
  setSelectedVendor: (vendor: Vendor) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  vendors, 
  setVendors,
  setSelectedVendor, 
  setIsModalOpen 
}) => {
  const stats = {
    total: 142,
    scheduled: 12,
    flagged: 3
  };

  return (
    <>
      <header className="header">
        <div className="header-titles">
          <h1>Vendor Assessment Center</h1>
          <p className="subtitle">Real-time autonomous compliance monitoring and report analysis.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Assess New Vendor
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div className="stat-content">
            <div className="stat-title">Total Vendors</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className="stat-content">
            <div className="stat-title">Auto-Requests Scheduled</div>
            <div className="stat-value text-warning">{stats.scheduled}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper red">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div className="stat-content">
            <div className="stat-title">Vendors Flagged</div>
            <div className="stat-value text-danger">{stats.flagged}</div>
          </div>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Status</th>
              <th>Next Report Due</th>
              <th>Exceptions</th>
              <th>Auto-Assess</th>
              <th style={{textAlign: 'right'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(vendor => {
              const latestReport = vendor.history[0];
              const isExpiring = latestReport?.expirationStatus === 'expiring-soon';
              return (
                <tr key={vendor.id} onClick={() => setSelectedVendor(vendor)} className="clickable-row">
                  <td>
                    <div className="vendor-cell">
                      <div className="vendor-avatar-small">{vendor.name.charAt(0)}</div>
                      <div className="vendor-info-cell">
                        <div className="vendor-name-cell">{vendor.name}</div>
                        <div className="vendor-email-cell">{vendor.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge status={vendor.status} /></td>
                  <td>
                    {latestReport ? (
                      <div className="due-date-container">
                        <span className={`due-date ${isExpiring ? 'warning' : ''}`}>
                          {latestReport.expiresAt}
                        </span>
                        {isExpiring && <span className="due-hint">Auto-requesting soon</span>}
                      </div>
                    ) : (
                      <span className="no-data">Awaiting Initial Assessment</span>
                    )}
                  </td>
                  <td>
                    {vendor.exceptions !== null 
                      ? <span className={`exception-count ${vendor.exceptions > 0 ? 'danger' : 'success'}`}>{vendor.exceptions}</span> 
                      : <span className="no-data">-</span>}
                  </td>
                  <td>
                    <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={vendor.autoAssess !== false}
                        onChange={(e) => {
                          const updatedVendors = vendors.map(v => 
                            v.id === vendor.id ? { ...v, autoAssess: e.target.checked } : v
                          );
                          setVendors(updatedVendors);
                        }}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td style={{textAlign: 'right'}}>
                    <button 
                      className="btn-text"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVendor(vendor);
                      }}
                    >
                      Inspect Report
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
