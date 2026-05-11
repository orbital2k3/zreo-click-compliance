import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages.css';

interface UploadError {
  title: string;
  message: string;
}

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [vendorName, setVendorName] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate PDF file
  const validatePdf = (file: File): { valid: boolean; error?: string } => {
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB

    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'Please upload a valid PDF file' };
    }

    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'PDF must be smaller than 50MB' };
    }

    return { valid: true };
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validation = validatePdf(file);

    if (!validation.valid) {
      setError({
        title: 'Invalid PDF',
        message: validation.error || 'Invalid file',
      });
      return;
    }

    setPdfFile(file);
    setError(null);
  }, []);

  // Handle drop zone drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input click
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Main upload flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorName.trim() || !pdfFile || !session?.access_token) {
      setError({
        title: 'Missing Information',
        message: 'Please fill in all fields and ensure you are logged in',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Initiate report and get signed upload URL
      const initiateResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/reports/initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ vendor_name: vendorName.trim() }),
        }
      );

      if (!initiateResponse.ok) {
        const errData = await initiateResponse.json();
        throw new Error(errData.error || 'Failed to initiate report');
      }

      const { report_id, upload_url } = await initiateResponse.json();

      // Step 2: Upload PDF to signed URL
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: pdfFile,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF. Please try again.');
      }

      // Step 3: Call checkout endpoint to validate and update status
      const checkoutResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/reports/${report_id}/checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!checkoutResponse.ok) {
        const errData = await checkoutResponse.json();
        throw new Error(errData.error || 'Failed to process report');
      }

      // Step 4: Redirect to report page
      navigate(`/report/${report_id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError({
        title: 'Upload Failed',
        message,
      });
      console.error('[UploadPage] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication
  if (!user) {
    return (
      <div className="page-container auth-required">
        <div className="auth-message">
          <h2>Authentication Required</h2>
          <p>Please log in to upload a report.</p>
        </div>
      </div>
    );
  }

  const isFormValid = vendorName.trim().length > 0 && pdfFile !== null;

  return (
    <div className="page-container upload-page">
      <div className="upload-card">
        <h1>Upload Compliance Report</h1>
        <p className="subtitle">Submit your vendor's compliance report for analysis</p>

        <form onSubmit={handleSubmit} className="upload-form">
          {/* Vendor Name Input */}
          <div className="form-group">
            <label htmlFor="vendor-name" className="form-label">
              Vendor Name
            </label>
            <input
              id="vendor-name"
              type="text"
              className="form-input"
              placeholder="e.g., Stripe, AWS, Microsoft"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* PDF Drag-and-Drop Zone */}
          <div className="form-group">
            <label className="form-label">Compliance Report (PDF)</label>
            <div
              className={`drop-zone ${isDragging ? 'dragging' : ''} ${pdfFile ? 'has-file' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                disabled={isLoading}
              />

              {pdfFile ? (
                <div className="file-selected">
                  <div className="file-icon">📄</div>
                  <div className="file-name">{pdfFile.name}</div>
                  <div className="file-size">
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    type="button"
                    className="change-file-btn"
                    onClick={handleBrowseClick}
                    disabled={isLoading}
                  >
                    Choose Different File
                  </button>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <div className="drop-icon">📁</div>
                  <p className="drop-text">Drag and drop your PDF here</p>
                  <p className="drop-subtext">or</p>
                  <button
                    type="button"
                    className="browse-btn"
                    onClick={handleBrowseClick}
                    disabled={isLoading}
                  >
                    Browse Files
                  </button>
                  <p className="drop-hint">PDF, up to 50MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <h4>{error.title}</h4>
                <p>{error.message}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Processing...' : 'Continue to Payment'}
          </button>

          {/* Metadata */}
          <div className="upload-info">
            <p>
              ✓ Your PDF is encrypted and stored securely
            </p>
            <p>
              ✓ Processing typically takes 2-5 minutes
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
