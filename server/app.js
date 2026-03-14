/**
 * Express app factory — separated from server entry point
 * so it can be imported by both the local server and Vercel serverless function.
 */
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';

import userRoutes from './routes/users.js';
import locationRoutes from './routes/locations.js';
import deviceRoutes from './routes/devices.js';
import telemetryRoutes from './routes/telemetry.js';
import invoiceRoutes from './routes/invoices.js';
import ticketRoutes from './routes/tickets.js';
import planRoutes from './routes/plans.js';
import carbonRoutes from './routes/carbon.js';
import notificationRoutes from './routes/notifications.js';
import subscriptionRoutes from './routes/subscriptions.js';
import paymentRoutes from './routes/payments.js';
import paymentMethodRoutes from './routes/payment-methods.js';
import groqRoutes from './routes/groq.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Connect DB once (Vercel keeps functions warm between requests)
let dbConnected = false;
app.use(async (req, res, next) => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EcoPower 2.0 API Running' });
});

app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/groq', groqRoutes);

export default app;
