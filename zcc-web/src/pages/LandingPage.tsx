import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing-page.css';

export const LandingPage: React.FC = () => {
  const rawPrice = import.meta.env.VITE_STRIPE_PRICE_AMOUNT;
  const parsedPrice = Number(rawPrice);
  const normalizedPrice =
    Number.isFinite(parsedPrice) && parsedPrice > 0
      ? parsedPrice > 100
        ? parsedPrice / 100
        : parsedPrice
      : 15;

  const formattedPrice = `$${normalizedPrice.toFixed(2)}`;

  return (
    <div className="landing-page">
      <header className="landing-nav fade-in-up" style={{ animationDelay: '40ms' }}>
        <div className="landing-branding">
          <p className="brand-kicker">Zero-Click Compliance</p>
          <h1 className="brand-name">ZCC</h1>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="lp-btn lp-btn-ghost">
            Sign In
          </Link>
          <Link to="/signup" className="lp-btn lp-btn-primary">
            Get Started
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero fade-in-up" style={{ animationDelay: '120ms' }}>
          <p className="section-eyebrow">SOC 2 report automation for security teams</p>
          <h2>SOC 2 Reviews in Minutes, Not Days</h2>
          <p className="hero-subheading">
            Upload a SOC 2 PDF and receive a professional, AI-powered analysis packet with risks,
            controls, and practical next steps for your stakeholders.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="lp-btn lp-btn-primary lp-btn-large">
              Get Started
            </Link>
            <a href="#how-it-works" className="lp-btn lp-btn-ghost lp-btn-large">
              Learn More
            </a>
          </div>
        </section>

        <section id="how-it-works" className="landing-section fade-in-up" style={{ animationDelay: '180ms' }}>
          <div className="section-heading-wrap">
            <p className="section-eyebrow">How it works</p>
            <h3>Three steps from upload to executive-ready output</h3>
          </div>
          <div className="steps-grid">
            <article className="step-card">
              <div className="step-icon" aria-hidden="true">
                01
              </div>
              <h4>Upload</h4>
              <p>Submit your SOC 2 report PDF through a secure workflow designed for sensitive documents.</p>
            </article>
            <article className="step-card">
              <div className="step-icon" aria-hidden="true">
                02
              </div>
              <h4>AI Analyzes</h4>
              <p>ZCC AI extracts findings, evaluates controls, and identifies risk signals in minutes.</p>
            </article>
            <article className="step-card">
              <div className="step-icon" aria-hidden="true">
                03
              </div>
              <h4>Download Report</h4>
              <p>Get a polished analysis document suitable for internal review and vendor governance workflows.</p>
            </article>
          </div>
        </section>

        <section className="landing-section fade-in-up" style={{ animationDelay: '240ms' }}>
          <div className="section-heading-wrap">
            <p className="section-eyebrow">Pricing</p>
            <h3>Transparent, pay-per-report pricing</h3>
          </div>
          <div className="pricing-card">
            <p className="pricing-value">{formattedPrice} per report</p>
            <p className="pricing-note">No subscription required</p>
            <p className="pricing-compare">
              Typical manual review cycles can take days. ZCC delivers analysis in minutes.
            </p>
            <Link to="/signup" className="lp-btn lp-btn-primary lp-btn-large pricing-cta">
              Start Your First Analysis
            </Link>
          </div>
        </section>

        <section className="landing-section fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="section-heading-wrap">
            <p className="section-eyebrow">Why teams trust ZCC</p>
            <h3>Built for security-conscious organizations</h3>
          </div>
          <div className="trust-grid">
            <article className="trust-card">
              <h4>Bank-grade security</h4>
              <p>Encrypted storage and strict access controls for every uploaded report.</p>
            </article>
            <article className="trust-card">
              <h4>AI-powered analysis</h4>
              <p>Modern AI pipelines tuned for structured compliance interpretation.</p>
            </article>
            <article className="trust-card">
              <h4>Refund guarantee</h4>
              <p>Confidence-backed delivery so teams can evaluate outcomes with lower risk.</p>
            </article>
          </div>
        </section>

        <section className="landing-cta fade-in-up" style={{ animationDelay: '360ms' }}>
          <h3>Ready to get started?</h3>
          <p>Turn SOC 2 documents into clear decisions for procurement and security teams.</p>
          <div className="hero-actions">
            <Link to="/signup" className="lp-btn lp-btn-primary lp-btn-large">
              Get Started
            </Link>
            <a href="#how-it-works" className="lp-btn lp-btn-ghost lp-btn-large">
              Learn More
            </a>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <nav className="footer-links" aria-label="Footer">
          <a href="#" className="footer-link">
            Terms of Service
          </a>
          <a href="#" className="footer-link">
            Privacy Policy
          </a>
          <a href="mailto:contact@zcc.ai" className="footer-link">
            Contact
          </a>
        </nav>
        <p className="footer-copy">© 2026 ZCC. All rights reserved.</p>
      </footer>
    </div>
  );
};
