import React, { useState } from 'react';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (vendorData: { name: string, email: string, contactName: string, contactAddress: string }) => void;
}

export const AddVendorModal: React.FC<AddVendorModalProps> = ({ 
  isOpen, 
  onClose, 
  onDeploy 
}) => {
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactAddress, setContactAddress] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName || !newVendorEmail) return;
    onDeploy({
      name: newVendorName,
      email: newVendorEmail,
      contactName,
      contactAddress
    });
    setNewVendorName('');
    setNewVendorEmail('');
    setContactName('');
    setContactAddress('');
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content-premium">
        <div className="modal-header-v2">
          <div className="modal-icon-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
          </div>
          <div className="modal-title-header">
            <h2 className="title">Assess New Vendor</h2>
            <p className="subtitle">Deploy the ZCC AI Agent to autonomously contact the vendor and request their SOC 2 Type II report.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group-v2">
            <label htmlFor="vendorName" className="label-v2">Company / Vendor Name</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                id="vendorName" 
                className="form-control-v2" 
                placeholder="e.g., Datadog, Slack, Vercel" 
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                autoFocus
                required 
              />
            </div>
          </div>
          
          <div className="form-group-v2">
            <label htmlFor="vendorEmail" className="label-v2">Vendor Security Email Contact</label>
            <div className="input-wrapper">
              <input 
                type="email" 
                id="vendorEmail" 
                className="form-control-v2" 
                placeholder="e.g., trust@datadoghq.com" 
                value={newVendorEmail}
                onChange={(e) => setNewVendorEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="form-group-v2">
            <label htmlFor="contactName" className="label-v2">Contact Person Name</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                id="contactName" 
                className="form-control-v2" 
                placeholder="e.g., Jane Doe" 
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group-v2">
            <label htmlFor="contactAddress" className="label-v2">Contact Location / Address</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                id="contactAddress" 
                className="form-control-v2" 
                placeholder="e.g., 123 Security Blvd, San Francisco, CA" 
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-large">
              <span>Deploy ZCC Agent</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
