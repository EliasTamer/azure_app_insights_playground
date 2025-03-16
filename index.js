const express = require("express");
const cors = require("cors");
const appInsights = require("applicationinsights");
require("dotenv").config();

const appInsightsConnectionString = process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING="InstrumentationKey=fd9cce4e-548a-4081-b27b-83c6c9d4a996;IngestionEndpoint=https://canadacentral-1.in.applicationinsights.azure.com/;LiveEndpoint=https://canadacentral.livediagnostics.monitor.azure.com/;ApplicationId=72e6a124-c073-4b71-911b-1cd869069210" || "";

// Initialize Application Insights with proper connection string format
appInsights
  .setup(appInsightsConnectionString)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true)
  .setUseDiskRetryCaching(true)
  .setSendLiveMetrics(true)
  .start();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Create a try/catch block to handle potential initialization issues
let client;
try {
  client = appInsights.defaultClient;
} catch (error) {
  console.error("Failed to initialize Application Insights client:", error);
}

app.get("/", (req, res) => {
  try {
    // Track a custom event
    client.trackEvent({
      name: "homePageVisited",
      properties: { customProperty: "customValue" },
    });
  } catch (error) {
    console.error("Failed to track event:", error);
  }
  res.send("Hello from App Insights Playground!!!");
});

// Example of tracking a custom metric
app.get("/api/data", (req, res) => {
  const startTime = Date.now();

  // Simulate some processing
  setTimeout(() => {
    const processingTime = Date.now() - startTime;

    try {
      // Track the processing time as a metric
      client.trackMetric({ name: "ProcessingTime", value: processingTime });
    } catch (error) {
      console.error("Failed to track metric:", error);
    }

    res.json({ message: "Data processed successfully" });
  }, 100);
});

// Example of tracking exceptions
app.get("/api/error", (req, res) => {
  try {
    throw new Error("This is a test error");
  } catch (error) {
    try {
      // Track the exception
      client.trackException({ exception: error });
    } catch (trackError) {
      console.error("Failed to track exception:", trackError);
    }
    res.status(500).json({ error: "An error occurred" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  try {
    // Track a custom event for server startup
    client.trackEvent({ name: "serverStartup", properties: { port: PORT } });
  } catch (error) {
    console.error("Failed to track server startup event:", error);
  }
});
