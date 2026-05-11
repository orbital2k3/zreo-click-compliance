import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vendorRoutes from './routes/vendors';
import webhookRoutes from './routes/webhooks';
import reportRoutes from './routes/reports';
import stripeRoutes from './routes/stripe';
import { jobQueue } from './worker/queue';
import { processReport } from './worker/processReport';

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

// IMPORTANT: express.raw() for /webhooks/stripe BEFORE express.json()
// This is needed for Stripe webhook signature verification (requires raw body)
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

// Apply JSON parser globally after raw body handlers
app.use(express.json());

// Routes
app.use('/api/vendors', vendorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/webhooks', stripeRoutes);

// Initialize job queue with report processing handler
jobQueue.setJobHandler(processReport);
console.log('[Worker] Job queue initialized with processReport handler');

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.listen(port, () => {
  console.log(`[ZCC API] Server active at http://localhost:${port}`);
});
