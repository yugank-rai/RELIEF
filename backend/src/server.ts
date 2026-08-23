import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/index.js';
import { seedDatabase } from './db/seed.js';

import authRouter from './routes/auth.js';
import incidentsRouter from './routes/incidents.js';
import volunteersRouter from './routes/volunteers.js';
import resourcesRouter from './routes/resources.js';
import sheltersRouter from './routes/shelters.js';
import analyticsRouter from './routes/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/volunteers', volunteersRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/shelters', sheltersRouter);
app.use('/api/analytics', analyticsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'DisasterOps Command Center (RELIEF) API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    theme: 'OmniKon 2026 Disaster Management',
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Bootstrap & Listen
async function startServer() {
  await initDatabase();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚨 DisasterOps Command Center (RELIEF) API Running`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🛡️  Auth: JWT RBAC (Citizen / Volunteer / Authority / Resource Manager)`);
    console.log(`======================================================\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
