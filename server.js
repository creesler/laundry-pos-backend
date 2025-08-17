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
// Enable CORS with both middleware and custom headers
app.use(cors({
  origin: '*',  // Allow all origins for now
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

// Add custom headers as backup
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  next();
});

app.use(express.json({ limit: '50mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies

// API routes with /api prefix
app.use('/api/employees', employeeRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sync', syncRoutes);

// Debug logging
console.log('Server environment:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  PWD: process.env.PWD,
  cwd: process.cwd(),
  __dirname,
  publicPath: path.join(__dirname, '../public'),
  adminPath: path.join(__dirname, '../public/admin')
});

// List directory contents
try {
  console.log('Files in current directory:', fs.readdirSync(__dirname));
  console.log('Files in public directory:', fs.readdirSync(path.join(__dirname, '../public')));
  console.log('Files in admin directory:', fs.readdirSync(path.join(__dirname, '../public/admin')));
} catch (error) {
  console.error('Error listing files:', error);
}

// Debug middleware to log every request
app.use((req, res, next) => {
  console.log('\n🔍 Request Debug:', {
    url: req.url,
    method: req.method,
    path: req.path,
    headers: req.headers,
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
    pwd: process.cwd(),
    dirname: __dirname
  });
  next();
});

// Get the public directory path based on environment
const getPublicPath = () => {
  // Always use __dirname for consistency
  const rootDir = __dirname;
  console.log('Root directory:', {
    VERCEL_ENV: process.env.VERCEL_ENV,
    cwd: process.cwd(),
    dirname: __dirname,
    rootDir
  });
  return path.join(rootDir, 'public');
};

// Define admin file paths
const publicPath = getPublicPath();
console.log('Public path:', publicPath);

const adminFiles = {
  index: path.join(publicPath, 'admin/index.html'),
  login: path.join(publicPath, 'admin/login.html'),
  test: path.join(publicPath, 'admin/test-redirect.html')
};

// Log admin file paths
console.log('Admin files:', {
  index: adminFiles.index,
  login: adminFiles.login,
  test: adminFiles.test,
  exists: {
    index: fs.existsSync(adminFiles.index),
    login: fs.existsSync(adminFiles.login),
    test: fs.existsSync(adminFiles.test)
  }
});

// Debug middleware to log file existence and paths
app.use((req, res, next) => {
  const filePath = path.join(publicPath, req.path);
  const htmlPath = filePath.endsWith('.html') ? filePath : `${filePath}.html`;
  
  console.log('Request debug:', {
    url: req.url,
    path: req.path,
    filePath,
    htmlPath,
    publicPath,
    fileExists: fs.existsSync(filePath),
    htmlExists: fs.existsSync(htmlPath),
    env: {
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
      cwd: process.cwd(),
      dirname: __dirname
    }
  });
  next();
});

// Handle admin routes first (before static middleware)
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Admin dashboard route
app.get('/admin', (req, res) => {
  console.log('Serving admin dashboard from:', adminFiles.index);
  if (fs.existsSync(adminFiles.index)) {
    res.sendFile(adminFiles.index);
  } else {
    res.status(404).send('Admin dashboard not found. Path: ' + adminFiles.index);
  }
});

// Admin login route
app.get('/admin/login', (req, res) => {
  console.log('Serving admin login from:', adminFiles.login);
  if (fs.existsSync(adminFiles.login)) {
    res.sendFile(adminFiles.login);
  } else {
    res.status(404).send('Admin login not found. Path: ' + adminFiles.login);
  }
});

// Test page route
app.get('/admin/test-redirect', (req, res) => {
  console.log('Serving test page from:', adminFiles.test);
  if (fs.existsSync(adminFiles.test)) {
    res.sendFile(adminFiles.test);
  } else {
    res.status(404).send('Test page not found. Path: ' + adminFiles.test);
  }
});

// Serve static files from public directory
app.use(express.static(publicPath));

// Serve admin static files
app.use('/admin', express.static(path.join(publicPath, 'admin')));

// Test routes that return plain HTML
app.get(['/test.html', '/test'], (req, res) => {
  console.log('Test route hit:', {
    dirname: __dirname,
    cwd: process.cwd(),
    env: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
  
  // Send a simple HTML response directly
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Direct Response Test</title>
    </head>
    <body>
        <h1>Direct Response Test</h1>
        <p>This page is being served directly from the route handler, not from a static file.</p>
        <p>Server Info:</p>
        <pre>
        __dirname: ${__dirname}
        cwd: ${process.cwd()}
        NODE_ENV: ${process.env.NODE_ENV}
        VERCEL_ENV: ${process.env.VERCEL_ENV}
        Time: ${new Date().toLocaleString()}
        </pre>
    </body>
    </html>
  `);
});

// Log all requests with detailed path info and static file checks
app.use((req, res, next) => {
  const paths = [
    path.join(__dirname, req.path),
    path.join(__dirname, 'public', req.path),
    path.join(__dirname, 'public/admin', req.path)
  ];

  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    url: req.url,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    headers: req.headers,
    query: req.query,
    body: req.body,
    staticPaths: paths.map(p => ({ path: p, exists: fs.existsSync(p) }))
  });
  next();
});

// Catch-all route handler
app.use('*', (req, res) => {
  const publicPath = path.join(__dirname, 'public');
  const adminPath = path.join(__dirname, 'public/admin');
  
  // Check if files exist in various locations
  const fileChecks = {
    [`${publicPath}${req.originalUrl}`]: fs.existsSync(`${publicPath}${req.originalUrl}`),
    [`${adminPath}${req.originalUrl}`]: fs.existsSync(`${adminPath}${req.originalUrl}`),
    [`${publicPath}/admin${req.originalUrl}`]: fs.existsSync(`${publicPath}/admin${req.originalUrl}`)
  };

  console.log('\n❌ 404 Debug Info:', {
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
    publicPath,
    adminPath,
    fileChecks,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      PWD: process.cwd(),
      dirname: __dirname
    }
  });

  // Send detailed 404 response
  res.status(404).send(`
    <html>
      <head><title>404 Debug Info</title></head>
      <body>
        <h1>404 Not Found</h1>
        <h2>Request Details:</h2>
        <pre>
          URL: ${req.originalUrl}
          Method: ${req.method}
          Path: ${req.path}
          Base: ${req.baseUrl}
        </pre>
        <h2>Server Environment:</h2>
        <pre>
          NODE_ENV: ${process.env.NODE_ENV}
          VERCEL_ENV: ${process.env.VERCEL_ENV}
          PWD: ${process.cwd()}
          __dirname: ${__dirname}
        </pre>
        <h2>File Checks:</h2>
        <pre>${JSON.stringify(fileChecks, null, 2)}</pre>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body,
    error: err.message,
    stack: err.stack
  });
  
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