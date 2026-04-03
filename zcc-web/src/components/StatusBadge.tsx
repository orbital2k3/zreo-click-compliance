import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'approved':
      return <span className="badge approved">● Approved</span>;
    case 'analyzing':
      return (
        <span className="badge analyzing">
          <div className="pulse-dot-small"></div>
          Analyzing PDF
        </span>
      );
    case 'flagged':
      return <span className="badge flagged">● Flagged (Exceptions)</span>;
    case 'outreach':
      return <span className="badge outreach">● Outreach Sent</span>;
    case 'awaiting-doc':
      return <span className="badge awaiting-doc">● Awaiting Document</span>;
    default:
      return <span className="badge pending">○ Awaiting SOC 2</span>;
  }
};

export const ExpirationBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'valid':
      return <span className="badge approved" style={{ fontSize: '0.7rem' }}>Valid</span>;
    case 'expiring-soon':
      return <span className="badge warning" style={{ fontSize: '0.7rem' }}>Auto-Requesting Soon (≤ 90 days)</span>;
    case 'expired':
      return <span className="badge pending" style={{ fontSize: '0.7rem' }}>Expired</span>;
    default:
      return null;
  }
};
