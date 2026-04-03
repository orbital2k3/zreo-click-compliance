import { useState } from 'react';
import './index.css';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { VendorDetail } from './components/VendorDetail';
import { EngineLog } from './components/EngineLog';
import { AddVendorModal } from './components/AddVendorModal';
import { CoordinatorAgent } from './lib/agents/CoordinatorAgent';
import type { AgentLog } from './lib/agents/types';

const MOCK_VENDORS = [
  { 
    id: 1, 
    name: 'Stripe', 
    email: 'security@stripe.com', 
    contactName: 'Jane Security',
    contactAddress: '354 Oyster Point Blvd, South San Francisco, CA',
    status: 'approved', 
    lastChecked: 'Oct 15, 2025', 
    exceptions: 0,
    history: [
      { 
        year: '2025', 
        date: 'Oct 15, 2025', 
        periodCovered: 'Oct 1, 2024 - Sep 30, 2025',
        expiresAt: 'Sep 30, 2026',
        expirationStatus: 'valid',
        status: 'approved', 
        exceptions: 0, 
        notes: 'Clean SOC 2 Type II report. No deviations found by KPMG auditors.', 
        reportName: 'Stripe_SOC2_TypeII_2025.pdf' 
      },
      { 
        year: '2024', 
        date: 'Sep 22, 2024', 
        periodCovered: 'Oct 1, 2023 - Sep 30, 2024',
        expiresAt: 'Sep 30, 2025',
        expirationStatus: 'expired',
        status: 'approved', 
        exceptions: 0, 
        notes: 'Standard annual report. All trust principles met.', 
        reportName: 'Stripe_SOC2_TypeII_2024.pdf' 
      }
    ]
  },
  { 
    id: 2, 
    name: 'AWS', 
    email: 'compliance@amazon.com', 
    contactName: 'AWS Compliance Team',
    contactAddress: '410 Terry Ave N, Seattle, WA',
    status: 'analyzing', 
    lastChecked: 'Just now', 
    exceptions: null,
    history: [
      { 
        year: '2025', 
        date: 'Processing...', 
        periodCovered: 'Unknown',
        expiresAt: 'Unknown',
        expirationStatus: 'pending',
        status: 'analyzing', 
        exceptions: null, 
        notes: 'Agent is currently parsing 215 pages. Extracting Auditor Opinion...', 
        reportName: 'AWS_Core_SOC2_2025.pdf' 
      },
      { 
        year: '2024', 
        date: 'Nov 01, 2024', 
        periodCovered: 'Apr 1, 2023 - Mar 31, 2024',
        expiresAt: 'Mar 31, 2025',
        expirationStatus: 'expired',
        status: 'approved', 
        exceptions: 1, 
        notes: '1 minor exception noted under CC6.1 Logical Access, isolated to a deprecated service region. Acceptable risk.', 
        reportName: 'AWS_Core_SOC2_2024.pdf' 
      }
    ]
  },
  { 
    id: 3, 
    name: 'SmallStartup Inc.', 
    email: 'founders@smallstartup.io', 
    contactName: 'Alice Founder',
    contactAddress: '123 Innovation Dr, Austin, TX',
    status: 'flagged', 
    lastChecked: '1 hour ago', 
    exceptions: 3,
    history: [
      { 
        year: '2025', 
        date: 'Jun 20, 2025', 
        periodCovered: 'May 1, 2024 - Apr 30, 2025',
        expiresAt: 'Apr 30, 2026',
        expirationStatus: 'expiring-soon',
        status: 'flagged', 
        exceptions: 3, 
        notes: 'Auditor identified 3 exceptions related to missing employee background checks and lack of physical access logs.', 
        reportName: 'SSI_SOC2_TypeI_2025.pdf' 
      }
    ]
  },
  { 
    id: 4, 
    name: 'SendGrid', 
    email: 'trust@twilio.com', 
    contactName: 'Compliance Officer',
    contactAddress: '375 Beale St, San Francisco, CA',
    status: 'pending', 
    lastChecked: 'Never', 
    exceptions: null,
    history: []
  }
];

const MOCK_LOGS: AgentLog[] = [
  { timestamp: '16:41:02.105', type: 'Agent', message: 'Initiating retrieval workflow for vendor AWS (compliance@amazon.com)' },
  { timestamp: '16:41:03.442', type: 'Agent', message: 'Email thread identified. Attachment [AWS_Core_SOC2_2025.pdf] found.' },
  { timestamp: '16:41:05.118', type: 'Agent', message: 'Downloading artifact: AWS_Core_SOC2_2025.pdf (14.2 MB)' },
  { timestamp: '16:41:12.801', type: 'Agent', message: 'Download complete. Routing to Parser Engine.' },
  { timestamp: '16:41:13.004', type: 'Parser', message: 'Initializing embedded PDF extraction. 215 pages detected.' },
  { timestamp: '16:41:15.656', type: 'Parser', message: 'OCR preprocessing applied to scanned exhibits.' },
  { timestamp: '16:41:18.992', type: 'Parser', message: 'Text layer structured into semantic blocks. Extracting Independent Auditor Opinion...' },
  { timestamp: '16:41:20.101', type: 'Model', message: 'Running LLM classification on Auditor Opinion block.' },
  { timestamp: '16:41:24.450', type: 'Model', message: 'Opinion structured: [UNQUALIFIED]. No material modifications required.' },
  { timestamp: '16:41:25.012', type: 'Parser', message: 'Locating Section IV: Description of Tests of Controls and Results...' },
  { timestamp: '16:41:27.888', type: 'Model', message: 'Executing targeted search for keywords: "deviation", "exception", "not operating effectively"' },
  { timestamp: '16:41:31.205', type: 'Model', message: 'Identified potential deviation on Page 142 (Control CC6.1 Logical Access).' },
  { timestamp: '16:41:32.544', type: 'Parser', message: 'Extracting contextual paragraph surrounding deviation.' },
  { timestamp: '16:41:35.190', type: 'Model', message: 'Summarizing risk vector...' },
];

function App() {
  const [vendors, setVendors] = useState<any[]>(MOCK_VENDORS);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'engine-log' | 'exceptions' | 'scheduled' | 'policies' | 'settings'>('dashboard');
  const [liveLogs, setLiveLogs] = useState<AgentLog[]>(MOCK_LOGS);

  const handleDeployAgent = async (vendorData: { name: string, email: string, contactName: string, contactAddress: string }) => {
    const { name, email, contactName, contactAddress } = vendorData;
    const newVendorId = Date.now();
    const newVendor = {
      id: newVendorId,
      name,
      email,
      contactName,
      contactAddress,
      status: 'outreach', // Starting status
      lastChecked: 'Just deployed',
      exceptions: null,
      history: []
    };

    setVendors([newVendor, ...vendors]);
    setIsModalOpen(false);
    setActiveView('dashboard');
    setSelectedVendor(null);

    // Initialize the Multi-Agent Coordinator
    const coordinator = new CoordinatorAgent();
    
    // Subscribe to all logs from all agents
    coordinator.subscribeToAll((log: AgentLog) => {
      setLiveLogs((prev: AgentLog[]) => [...prev, log]);
      
      // Map agent types back to UI statuses for the table
      if (log.type === 'OUTREACH') {
        setVendors((prev: any[]) => prev.map(v => v.id === newVendorId ? { ...v, status: 'outreach' } : v));
      } else if (log.type === 'PARSER') {
        setVendors((prev: any[]) => prev.map(v => v.id === newVendorId ? { ...v, status: 'analyzing' } : v));
      } else if (log.type === 'SCORING') {
        setVendors((prev: any[]) => prev.map(v => v.id === newVendorId ? { ...v, status: 'analyzing' } : v));
      }
    });

    // Run the multi-agent workflow
    try {
      const result = await coordinator.run({ name, email });
      
      if (result) {
        setVendors((prev: any[]) => prev.map(v => v.id === newVendorId ? { 
          ...v, 
          status: result.verdict.toLowerCase(),
          lastChecked: 'Just now',
          exceptions: result.score > 90 ? 0 : 1,
          history: [{
            year: '2025', 
            date: 'Just now', 
            periodCovered: 'Jan 1, 2024 - Dec 31, 2024',
            expiresAt: 'Dec 31, 2025',
            expirationStatus: 'valid',
            status: result.verdict.toLowerCase(), 
            exceptions: result.score > 90 ? 0 : 1, 
            notes: `ZCC AI Ensemble orchestrated by CoordinatorAgent. Verdict: ${result.verdict}. Final Trust Score: ${result.score}/100. All agents reported success.`, 
            reportName: `${name}_SOC2_2025.pdf` 
          }]
        } : v));
      }
    } catch (err) {
      console.error('Agent workflow failed:', err);
    }
  };

  const handleUploadReport = async (vendor: any, file: File) => {
    // Flip the vendor to 'analyzing' immediately so the UI reacts
    setVendors((prev: any[]) =>
      prev.map(v => v.id === vendor.id ? { ...v, status: 'analyzing', lastChecked: 'Just now' } : v)
    );
    setSelectedVendor((prev: any) => prev ? { ...prev, status: 'analyzing' } : prev);

    const coordinator = new CoordinatorAgent();
    coordinator.subscribeToAll((log: AgentLog) => {
      setLiveLogs((prev: AgentLog[]) => [...prev, log]);
    });

    try {
      const result = await coordinator.runWithUpload(vendor, file);
      if (result) {
        const newReport = {
          year: new Date().getFullYear().toString(),
          date: new Date().toLocaleDateString(),
          periodCovered: 'Manually uploaded',
          expiresAt: 'Unknown',
          expirationStatus: 'valid',
          status: result.verdict.toLowerCase(),
          exceptions: result.score > 90 ? 0 : 1,
          notes: `Manually uploaded and analysed by ZCC. Verdict: ${result.verdict}. Trust Score: ${result.score}/100.`,
          reportName: file.name,
        };
        setVendors((prev: any[]) =>
          prev.map(v =>
            v.id === vendor.id
              ? { ...v, status: result.verdict.toLowerCase(), history: [newReport, ...v.history] }
              : v
          )
        );
        setSelectedVendor((prev: any) =>
          prev ? { ...prev, status: result.verdict.toLowerCase(), history: [newReport, ...prev.history] } : prev
        );
      }
    } catch (err) {
      console.error('Upload agent workflow failed:', err);
    }
  };

  const handleEditVendor = (vendorId: number, updatedFields: any) => {
    setVendors((prev: any[]) =>
      prev.map(v => v.id === vendorId ? { ...v, ...updatedFields } : v)
    );
    setSelectedVendor((prev: any) => prev && prev.id === vendorId ? { ...prev, ...updatedFields } : prev);
  };

  const renderContent = () => {
    if (activeView === 'engine-log') return <EngineLog logs={liveLogs} />;
    
    // Placeholder views for other nav items
    if (activeView === 'exceptions') {
      return (
        <div className="empty-state-container">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
          </div>
          <h3>Exceptions Inbox</h3>
          <p>0 Critical Exceptions requiring your manual approval at this time.</p>
        </div>
      );
    }

    if (activeView === 'scheduled' || activeView === 'policies' || activeView === 'settings') {
      return (
        <div className="empty-state-container">
          <h3>{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h3>
          <p>This module is currently initializing in the agentic cluster.</p>
        </div>
      );
    }

    if (selectedVendor) return <VendorDetail vendor={selectedVendor} setSelectedVendor={setSelectedVendor} onUploadReport={handleUploadReport} onEditVendor={handleEditVendor} />;
    
    return (
      <Dashboard 
        vendors={vendors} 
        setVendors={setVendors} 
        setSelectedVendor={setSelectedVendor} 
        setIsModalOpen={setIsModalOpen}
      />
    );
  };

  return (
    <div className="app-container">
      <AddVendorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onDeploy={handleDeployAgent} 
      />
      
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        selectedVendor={selectedVendor}
        setSelectedVendor={setSelectedVendor}
      />

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
