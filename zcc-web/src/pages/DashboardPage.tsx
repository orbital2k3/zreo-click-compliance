import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import '../styles/dashboard-page.css';

interface Report {
  id: string;
  vendor_id?: string;
  title: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  created_at: string;
  completed_at?: string;
}


export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(false);
  const pollingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch reports from backend
  const fetchReports = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/reports`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
      setError(null);
    } catch (err) {
      console.error('[DashboardPage] Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    }
  }, [session?.access_token]);

  // Initial load of reports
  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    fetchReports().finally(() => {
      setLoading(false);
    });
  }, [session?.access_token, fetchReports]);

  // Setup polling for processing reports
  useEffect(() => {
    const hasProcessingReports = reports.some((r) => r.status === 'processing');

    if (hasProcessingReports && !pollingActive) {
      setPollingActive(true);
      pollingIntervalRef.current = setInterval(() => {
        fetchReports();
      }, 10000); // Poll every 10 seconds
    } else if (!hasProcessingReports && pollingActive) {
      setPollingActive(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [reports, pollingActive, fetchReports]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render empty state
  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Reports</h1>
          <p>Loading your reports...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Reports</h1>
          <p>Please sign in to view your reports.</p>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="header-top">
            <h1>Reports</h1>
            <button
              className="btn-primary"
              onClick={() => navigate('/upload')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Report
            </button>
          </div>
          <p>Upload your first SOC 2 report to get started</p>
        </div>

        <div className="page-content">
          <div className="empty-state-container">
            <div className="empty-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
            </div>
            <h3>No reports yet</h3>
            <p>Upload your SOC 2 Type II report to generate compliance insights</p>
            <button
              className="btn-primary-large"
              onClick={() => navigate('/upload')}
            >
              Upload Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render reports table
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top">
          <h1>Reports</h1>
          <button className="btn-primary" onClick={() => navigate('/upload')}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Report
          </button>
        </div>
        <p>Manage and download your SOC 2 compliance reports</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Date Submitted</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="report-row">
                <td>
                  <div className="vendor-cell">
                    <div className="vendor-avatar-small">
                      {report.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="vendor-info-cell">
                      <div className="vendor-name-cell">{report.title}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="date-cell">
                    {formatDate(report.created_at)}
                  </div>
                </td>
                <td>
                  <ReportStatusBadge status={report.status} />
                </td>
                <td>
                  <div className="action-buttons">
                    {report.status === 'ready' && (
                      <button
                        className="btn-action btn-download"
                        onClick={() => navigate(`/report/${report.id}`)}
                        title="Download report"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download
                      </button>
                    )}
                    <button
                      className="btn-action btn-view"
                      onClick={() => navigate(`/report/${report.id}`)}
                      title="View report details"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * ReportStatusBadge: Displays report status with appropriate styling and animations
 * - pending: yellow
 * - processing: blue with pulse animation
 * - ready: green
 * - failed: red
 */
interface ReportStatusBadgeProps {
  status: 'pending' | 'processing' | 'ready' | 'failed';
}

const ReportStatusBadge: React.FC<ReportStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'pending':
      return (
        <span className="badge report-badge pending">
          ◯ Pending
        </span>
      );
    case 'processing':
      return (
        <span className="badge report-badge processing">
          <div className="pulse-dot"></div>
          Processing
        </span>
      );
    case 'ready':
      return (
        <span className="badge report-badge ready">
          ● Ready
        </span>
      );
    case 'failed':
      return (
        <span className="badge report-badge failed">
          ✕ Failed
        </span>
      );
    default:
      return (
        <span className="badge report-badge pending">
          ◯ Unknown
        </span>
      );
  }
};
