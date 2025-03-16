const express = require('express');
const cors = require('cors');
// Import the applicationinsights package
const appInsights = require('applicationinsights');

// Load environment variables if needed
// require('dotenv').config();

// Configuration for Azure Monitoring
const INSTRUMENTATION_KEY = process.env.AZURE_INSTRUMENTATION_KEY || 'your_instrumentation_key';

// Initialize Application Insights
appInsights.setup(INSTRUMENTATION_KEY)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true) // true enables collection of SQL performance stats
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);

// Start Application Insights
appInsights.start();

// Get the Application Insights client for manual tracking
const client = appInsights.defaultClient;

// Create the Express app
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Add middleware to track additional request info
app.use((req, res, next) => {
  // Start time for request duration tracking
  const startTime = Date.now();
  
  // Capture the original end method
  const originalEnd = res.end;
  
  // Override the end method to track additional metrics
  res.end = function(...args) {
    // Calculate request duration
    const duration = Date.now() - startTime;
    
    // Track custom metrics for all requests
    client.trackMetric({
      name: "request-duration",
      value: duration,
      properties: {
        path: req.path,
        method: req.method,
        statusCode: res.statusCode
      }
    });
    
    // Call the original end method
    return originalEnd.apply(this, args);
  };
  
  next();
});

// Home route
app.get('/', async (req, res) => {
  client.trackEvent({
    name: "home-page-request", 
    properties: { customProperty: "custom-value" }
  });
  res.send('Hello from App Insights Playground!');
});

// Data API route
app.get('/api/data', (req, res) => {
  // Custom business logic metric tracking
  client.trackMetric({
    name: "data-api-response-time", 
    value: 300
  });
  
  // Track a custom business event
  client.trackEvent({
    name: "data-endpoint-accessed",
    properties: {
      user: req.query.user || 'anonymous',
      timestamp: new Date().toISOString()
    }
  });
  
  res.json({ message: 'Data endpoint' });
});

// External API call simulation route
app.get('/api/external', async (req, res) => {
  const startTime = Date.now();
  try {
    // Simulate external API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Track the dependency manually (though auto-collection will also capture this)
    client.trackDependency({
      target: "external-api.example.com",
      name: "ExternalAPICall",
      data: "/api/data",
      duration: Date.now() - startTime,
      resultCode: 200,
      success: true,
      dependencyTypeName: "HTTP"
    });
    
    res.json({ message: 'External API call successful' });
  } catch (error) {
    client.trackException({
      exception: error,
      properties: {
        endpoint: '/api/external',
        errorMessage: error.message
      }
    });
    
    client.trackDependency({
      target: "external-api.example.com",
      name: "ExternalAPICall",
      data: "/api/data",
      duration: Date.now() - startTime,
      resultCode: 500,
      success: false,
      dependencyTypeName: "HTTP"
    });
    
    res.status(500).json({ error: 'External API call failed' });
  }
});

// Error route
app.get('/api/error', (req, res) => {
  try {
    throw new Error('This is a test error');
  } catch (error) {
    // Track the exception with enhanced information
    client.trackException({
      exception: error,
      properties: {
        route: '/api/error',
        operation: 'test-error',
        severity: 'medium',
        stack: error.stack
      }
    });
    res.status(500).json({ message: 'Error occurred' });
  }
});

// Add a custom user tracking route
app.post('/api/user-action', (req, res) => {
  const { userId, action, details } = req.body;
  
  // Track user activity
  client.trackEvent({
    name: "user-action",
    properties: {
      userId,
      action,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString()
    }
  });
  
  res.json({ success: true });
});

// Catch-all route for 404s
app.use((req, res) => {
  client.trackEvent({
    name: "not-found",
    properties: {
      path: req.path,
      method: req.method
    }
  });
  res.status(404).json({ message: 'Resource not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  client.trackException({
    exception: err,
    properties: {
      route: req.path,
      method: req.method,
      severity: 'high',
      stack: err.stack,
      handled: false
    }
  });
  
  res.status(500).json({ message: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  client.trackEvent({
    name: "server-started", 
    properties: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    }
  });
  console.log(`Server running on port ${PORT} with Azure Application Insights monitoring`);
});