import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import bodyParser from "body-parser";
import whatsappRoutes from "./routes/whatsapp.routes";
import authRoutes from "./routes/auth.routes";
import metricsRoutes from "./routes/metrics.routes";
import { rateLimiter } from "./utils/rate-limiter";
import { MetricsService } from "./services/metrics.service";
import { errorHandler } from "./middleware/error_handler";

// Create Express app
const app = express();
const metricsService = MetricsService.getInstance();

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter(100, 60000)); // Limit to 100 requests per minute

// Request logging and metrics
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  req.headers["x-request-id"] = requestId;

  // Start timer for request duration
  metricsService.startTimer(`request_${requestId}`);
  metricsService.increment("requests_total");

  res.on("finish", () => {
    const duration = metricsService.endTimer(`request_${requestId}`);
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    metricsService.increment(`status_${res.statusCode}`);
  });

  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/metrics", metricsRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use(errorHandler);

export default app;
