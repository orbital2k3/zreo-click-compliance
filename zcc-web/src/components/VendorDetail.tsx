import React, { useState } from 'react';
import { StatusBadge, ExpirationBadge } from './StatusBadge';

interface VendorDetailProps {
  vendor: any;
  setSelectedVendor: (vendor: any) => void;
  onUploadReport: (vendor: any, file: File) => Promise<void>;
  onEditVendor: (vendorId: number, updatedFields: any) => void;
}

export const VendorDetail: React.FC<VendorDetailProps> = ({ 
  vendor, 
  setSelectedVendor,
  onUploadReport,
  onEditVendor,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: vendor.name,
    email: vendor.email,
    contactName: vendor.contactName || '',
    contactAddress: vendor.contactAddress || ''
  });

  const handleSave = () => {
    onEditVendor(vendor.id, editForm);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditForm({
      name: vendor.name,
      email: vendor.email,
      contactName: vendor.contactName || '',
      contactAddress: vendor.contactAddress || ''
    });
    setIsEditing(false);
  };
  return (
    <div className="vendor-detail-view">
      <div className="detail-breadcrumb">
        <button className="btn-back" onClick={() => setSelectedVendor(null)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Assessment Center
        </button>
      </div>

      <div className="detail-header-card">
        <div className="header-left">
          <div className="vendor-avatar-large">{vendor.name.charAt(0)}</div>
          <div className="header-text" style={{ flex: 1, minWidth: '300px' }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ background: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: 'white', padding: '4px 8px', fontSize: '18px', fontWeight: 'bold' }}
                  placeholder="Vendor Name"
                />
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{ background: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', padding: '4px 8px', fontSize: '13px' }}
                  placeholder="Email Address"
                />
                <input 
                  type="text" 
                  value={editForm.contactName} 
                  onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                  style={{ background: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', padding: '4px 8px', fontSize: '13px' }}
                  placeholder="Contact Name (e.g. Jane Doe)"
                />
                <input 
                  type="text" 
                  value={editForm.contactAddress} 
                  onChange={(e) => setEditForm({ ...editForm, contactAddress: e.target.value })}
                  style={{ background: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', padding: '4px 8px', fontSize: '13px' }}
                  placeholder="Contact Address"
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={handleSave} className="btn-primary-small">Save</button>
                  <button onClick={handleCancel} className="btn-secondary-small">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h1 className="vendor-title">{vendor.name}</h1>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                    title="Edit Vendor Information"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '6px' }}>
                  <a href={`mailto:${vendor.email}`} className="vendor-email-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    {vendor.email}
                  </a>

                  {vendor.contactName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      {vendor.contactName}
                    </div>
                  )}

                  {vendor.contactAddress && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {vendor.contactAddress}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label 
            className="btn-primary" 
            style={{ 
              cursor: 'pointer', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              fontSize: '14px', 
              fontWeight: 600,
              backgroundColor: '#4F46E5', // Indigo-600
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'} // Indigo-700
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
          >
            <input 
              type="file" 
              style={{ display: 'none' }} 
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadReport(vendor, file);
                e.target.value = '';
              }} 
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Upload Report
          </label>
          <StatusBadge status={vendor.status} />
        </div>
      </div>

      <div className="history-section">
        <div className="section-header">
          <h2 className="section-title">SOC 2 Assessment History</h2>
          <div className="section-actions">
            <button className="btn-secondary-small">Download All Files</button>
          </div>
        </div>
        
        {vendor.history.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"></path><path d="M22 2L15 22 11 13 2 9z"></path></svg>
            </div>
            <h3>No Reports Found</h3>
            <p>The ZCC Agent is currently initiating the outreach sequence to {vendor.email}.</p>
          </div>
        ) : (
          <div className="timeline-v2">
            {vendor.history.map((report: any, index: number) => (
              <div key={index} className={`timeline-entry ${report.status === 'analyzing' ? 'pulse' : ''}`}>
                <div className="timeline-connector"></div>
                <div className="timeline-dot-v2"></div>
                <div className="timeline-content-v2">
                  <div className="report-summary-header">
                    <div className="report-meta">
                      <h3 className="report-year">{report.year} Report Analysis</h3>
                      <span className="analysis-date">Synthesized: {report.date}</span>
                    </div>
                    <div className="report-badges">
                      <ExpirationBadge status={report.expirationStatus} />
                      <StatusBadge status={report.status} />
                    </div>
                  </div>
                  
                  <div className="report-dashboard-card">
                    <div className="card-top-info">
                      <div className="report-file-pill">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        <span className="file-name">{report.reportName}</span>
                      </div>
                      <div className="report-period">
                        <span className="label">Period:</span> <span className="value">{report.periodCovered}</span>
                        <span className="bullet">•</span>
                        <span className="label">Expires:</span> <span className={`value ${report.expirationStatus === 'expiring-soon' ? 'text-warning' : ''}`}>{report.expiresAt}</span>
                      </div>
                    </div>
                    
                    <div className="report-body">
                      <div className="analysis-item">
                        <h4 className="label-tiny">Agent Summary</h4>
                        <p className="summary-text">{report.notes}</p>
                      </div>
                      
                      {report.exceptions !== null && (
                        <div className={`exception-summary ${report.exceptions > 0 ? 'found' : 'clean'}`}>
                          <div className="exception-status">
                            <div className="status-indicator"></div>
                            <span className="status-text">
                              {report.exceptions > 0 
                                ? `Identified ${report.exceptions} Exception${report.exceptions > 1 ? 's' : ''}` 
                                : '0 Exceptions Found'}
                            </span>
                          </div>
                          {report.exceptions > 0 && (
                            <button className="btn-text-tiny">View Extracted Exceptions</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
