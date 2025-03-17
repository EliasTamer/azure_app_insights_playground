require("dotenv").config();

const appInsights = require("applicationinsights");
require("@azure/opentelemetry-instrumentation-azure-sdk");

const express = require("express");
const app = express();
const port = 8080;

const connectionString = process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING || "";

if (!connectionString) {
  console.error("Azure Application Insights connection string is not set.");
} else {
  appInsights
    .setup(connectionString)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, false)
    .setAutoCollectPreAggregatedMetrics(true)
    .setSendLiveMetrics(false)
    .setInternalLogging(false, true)
    .enableWebInstrumentation(false);

  try {
    appInsights.start();
    console.log("Application Insights started successfully");
  } catch (err) {
    console.error("Failed to start Application Insights:", err);
  }
}

app.use(express.json());

app.get("/", (req, res) => {
  appInsights.defaultClient.trackEvent({
    name: "HomePageVisited",
    properties: { timestamp: new Date() },
  });
  res.send("Hello World!");
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  appInsights.defaultClient.trackMetric({
    name: "UserProfileViews",
    value: 1,
  });
  res.send(`User ID: ${userId}`);
});

app.use((err, req, res, next) => {
  appInsights.defaultClient.trackException({ exception: err });
  res.status(500).send("Something went wrong!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
