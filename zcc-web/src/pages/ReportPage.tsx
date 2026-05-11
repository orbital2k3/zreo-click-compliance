import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Report {
  id: string;
  title: string;
  status: 'pending_upload' | 'pending_payment' | 'processing' | 'ready' | 'failed';
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Fetch report status
  const fetchReport = async () => {
    if (!id || !session?.access_token) return;

    try {
      const response = await fetch(`${apiUrl}/api/reports/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok) {
        setError('Failed to fetch report');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setReport(data.report);
      setError(null);

      // If status is processing, continue polling
      if (data.report.status === 'processing') {
        setIsPolling(true);
      } else {
        setIsPolling(false);
      }
    } catch (err) {
      console.error('[ReportPage] Error fetching report:', err);
      setError('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  // Set up polling for processing status
  useEffect(() => {
    if (!isPolling || !id) return;

    const interval = setInterval(() => {
      fetchReport();
    }, 10000); // Poll every 10 seconds

    pollIntervalRef.current = interval;

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isPolling, id]);

  // Fetch report on mount
  useEffect(() => {
    fetchReport();
  }, [id, session]);

  // Handle redirect from successful payment
  useEffect(() => {
    if (searchParams.get('status') === 'success') {
      // Clear the query parameter
      navigate(`/report/${id}`, { replace: true });
    }
  }, [searchParams, id, navigate]);

  // Handle "Pay Now" redirect
  const handlePayNow = async () => {
    if (!id || !session?.access_token) return;

    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/reports/${id}/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to initiate checkout');
        return;
      }

      const data = await response.json();
      if (data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      console.error('[ReportPage] Error initiating checkout:', err);
      setError('Failed to initiate checkout');
    } finally {
      setLoading(false);
    }
  };

  // Handle download report
  const handleDownload = () => {
    if (!id) return;
    // This will be wired by Task 3A
    console.log(`[ReportPage] Download report: ${id}`);
    // TODO: Implement download logic when Task 3A creates the endpoint
  };

  // Render content based on status
  const renderStatusContent = () => {
    if (!report) return null;

    switch (report.status) {
      case 'pending_upload':
        return (
          <div className="status-container pending-upload">
            <div className="status-icon">
              <div className="spinner"></div>
            </div>
            <h2>Upload in progress...</h2>
            <p>Your report is being uploaded. Please wait.</p>
          </div>
        );

      case 'pending_payment':
        return (
          <div className="status-container pending-payment">
            <div className="status-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="1"></circle>
                <path d="M12 8v4"></path>
                <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"></path>
              </svg>
            </div>
            <h2>Awaiting payment</h2>
            <p>Complete your payment to start the analysis process.</p>
            <button className="btn btn-primary" onClick={handlePayNow} disabled={loading}>
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        );

      case 'processing':
        return (
          <div className="status-container processing">
            <div className="status-icon">
              <div className="spinner"></div>
            </div>
            <h2>AI is analyzing your report...</h2>
            <p>Our AI is performing a comprehensive security compliance analysis. This typically takes 2-5 minutes.</p>
            <p className="text-muted">You will be notified when the analysis is complete.</p>
          </div>
        );

      case 'ready':
        return (
          <div className="status-container ready">
            <div className="status-icon success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2>Analysis complete!</h2>
            <p>Your comprehensive security compliance report is ready to download.</p>
            <button className="btn btn-primary" onClick={handleDownload}>
              Download Report
            </button>
          </div>
        );

      case 'failed':
        return (
          <div className="status-container failed">
            <div className="status-icon error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2>Analysis failed</h2>
            <p>{report.error_message || 'The analysis could not be completed.'}</p>
            <p className="text-muted">A refund has been issued to your account.</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="auth-required">
          <h1>Authentication Required</h1>
          <p>Please log in to view your report.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container report-page">
      <header className="page-header">
        <h1>{report?.title || 'Report'}</h1>
        <p className="report-id">ID: {id}</p>
      </header>

      <main className="page-content">
        {error && <div className="error-banner">{error}</div>}

        {loading && !report ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading report...</p>
          </div>
        ) : (
          renderStatusContent()
        )}

        {report && (
          <div className="report-meta">
            <div className="meta-item">
              <span className="label">Created:</span>
              <span className="value">
                {new Date(report.created_at).toLocaleDateString()} at{' '}
                {new Date(report.created_at).toLocaleTimeString()}
              </span>
            </div>
            {report.completed_at && (
              <div className="meta-item">
                <span className="label">Completed:</span>
                <span className="value">
                  {new Date(report.completed_at).toLocaleDateString()} at{' '}
                  {new Date(report.completed_at).toLocaleTimeString()}
                </span>
              </div>
            )}
            <div className="meta-item">
              <span className="label">Status:</span>
              <span className={`badge badge-${report.status}`}>{report.status}</span>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .report-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          padding: 2rem 1.5rem;
          background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
          border-bottom: 1px solid #30363d;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 2rem;
          color: #c9d1d9;
          margin: 0 0 0.5rem 0;
        }

        .report-id {
          color: #8b949e;
          font-size: 0.875rem;
          margin: 0;
        }

        .auth-required {
          text-align: center;
          padding: 3rem 1.5rem;
        }

        .auth-required h1 {
          color: #c9d1d9;
          margin-bottom: 1rem;
        }

        .auth-required p {
          color: #8b949e;
          margin-bottom: 2rem;
        }

        .error-banner {
          background: #da3633;
          color: white;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 2rem;
          font-size: 0.875rem;
        }

        .loading {
          text-align: center;
          padding: 3rem 1.5rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 1rem;
          border: 3px solid #30363d;
          border-top-color: #58a6ff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .status-container {
          text-align: center;
          padding: 2rem 1.5rem;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .status-container h2 {
          color: #c9d1d9;
          font-size: 1.5rem;
          margin: 1rem 0 0.5rem 0;
        }

        .status-container p {
          color: #8b949e;
          margin: 0.5rem 0;
          font-size: 0.95rem;
        }

        .text-muted {
          color: #6e7681 !important;
          font-size: 0.875rem !important;
        }

        .status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          border-radius: 50%;
          background: #0d1117;
        }

        .status-icon svg {
          color: #58a6ff;
        }

        .status-icon.success {
          background: rgba(3, 102, 214, 0.1);
        }

        .status-icon.success svg {
          color: #3fb950;
        }

        .status-icon.error {
          background: rgba(218, 54, 51, 0.1);
        }

        .status-icon.error svg {
          color: #da3633;
        }

        .btn {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 1.5rem;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #58a6ff;
          color: #0d1117;
        }

        .btn-primary:hover:not(:disabled) {
          background: #79c0ff;
          box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2);
        }

        .report-meta {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .meta-item .label {
          color: #8b949e;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .meta-item .value {
          color: #c9d1d9;
          font-size: 0.95rem;
        }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          width: fit-content;
        }

        .badge-pending_upload {
          background: #1f6feb;
          color: #79c0ff;
        }

        .badge-pending_payment {
          background: #d29922;
          color: #ffc857;
        }

        .badge-processing {
          background: #58a6ff;
          color: #0d1117;
        }

        .badge-ready {
          background: #3fb950;
          color: #0d1117;
        }

        .badge-failed {
          background: #da3633;
          color: #ffb4b1;
        }
      `}</style>
    </div>
  );
};
