import express from 'express';
import cors from 'cors';
import { app as userApp } from './user-backend/index.js';
import { app as adminApp } from './admin-backend/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check for the global load balancer / API Gateway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Gateway is running' });
});

// Mount user and admin backends at their respective routes
app.use('/api', userApp);
app.use('/admin-api', adminApp);

app.listen(PORT, () => {
  console.log(`API Gateway Server running on port ${PORT}`);
  console.log(`User Backend mounted at: http://localhost:${PORT}/api`);
  console.log(`Admin Backend mounted at: http://localhost:${PORT}/admin-api`);
});
