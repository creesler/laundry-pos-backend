/**
 * Laundry POS Backend Server
 * Version: 1.0.2
 * Last Updated: 2025-08-18
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { connectDB } from './config/db.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv
dotenv.config({ path: path.join(__dirname, '.env') });

// Import routes
import employeeRoutes from './routes/employees.js';
import salesRoutes from './routes/sales.js';
import timesheetRoutes from './routes/timesheets.js';
import inventoryRoutes from './routes/inventory.js';
import syncRoutes from './routes/sync.js';

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes with /api prefix
app.use('/api/employees', employeeRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sync', syncRoutes);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Admin routes - serve static files from admin directory
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Admin routes
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Serve admin pages
app.get(['/admin', '/admin/*'], (req, res) => {
    const requestPath = req.path;
    console.log('Admin request path:', requestPath);

    let filePath;
    if (requestPath === '/admin/login') {
        filePath = path.join(__dirname, 'public/admin/login.html');
    } else {
        filePath = path.join(__dirname, 'public/admin/index.html');
    }

    console.log('Attempting to serve file:', filePath);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
        console.log('File exists, sending...');
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Error loading page');
            }
        });
    } else {
        console.error('File not found:', filePath);
        res.status(404).send('Page not found');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server if not being imported (for Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel
export default app;