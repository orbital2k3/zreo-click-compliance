import React from 'react';

interface SidebarProps {
  activeView: 'dashboard' | 'engine-log' | 'exceptions' | 'scheduled' | 'policies' | 'settings';
  setActiveView: (view: any) => void;
  selectedVendor: any;
  setSelectedVendor: (vendor: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  selectedVendor, 
  setSelectedVendor 
}) => {
  const navigateToDashboard = () => {
    setActiveView('dashboard');
    setSelectedVendor(null);
  };

  const handleNavClick = (view: string) => {
    setActiveView(view);
    if (view !== 'dashboard') {
      setSelectedVendor(null);
    }
  };

  return (
    <aside className="sidebar">
      <div className="logo-container" onClick={navigateToDashboard} style={{ cursor: 'pointer' }}>
        <img src="/zcc-logo.png" alt="ZCC Logo" className="logo-img" />
        <div className="logo-text">
          <span className="logo-top">ZERO CLICK</span>
          <span className="logo-bottom">COMPLIANCE</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-group">
          <div className="nav-group-title">Assessment</div>
          <button 
            className={`nav-link ${activeView === 'dashboard' && !selectedVendor ? 'active' : ''}`} 
            onClick={() => handleNavClick('dashboard')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            Vendor Directory
          </button>
          <button 
            className={`nav-link ${activeView === 'exceptions' ? 'active' : ''}`} 
            onClick={() => handleNavClick('exceptions')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Exceptions Inbox
          </button>
        </div>

        <div className="nav-group">
          <div className="nav-group-title">Automation Engine</div>
          <button 
            className={`nav-link ${activeView === 'scheduled' ? 'active' : ''}`} 
            onClick={() => handleNavClick('scheduled')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"></path><path d="M22 2L15 22 11 13 2 9z"></path></svg>
            Scheduled Requests
            <span className="sidebar-badge">12</span>
          </button>
          <button 
            className={`nav-link ${activeView === 'engine-log' ? 'active' : ''}`} 
            onClick={() => handleNavClick('engine-log')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
            Engine Logs
          </button>
        </div>
        
        <div className="nav-group">
          <div className="nav-group-title">System</div>
          <button 
            className={`nav-link ${activeView === 'policies' ? 'active' : ''}`} 
            onClick={() => handleNavClick('policies')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Risk Policies
          </button>
          <button 
            className={`nav-link ${activeView === 'settings' ? 'active' : ''}`} 
            onClick={() => handleNavClick('settings')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Settings
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">BD</div>
          <div className="user-info">
            <div className="user-name">Bogdan D.</div>
            <div className="user-role">Security Ops</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
