import { Router } from "express"
import { MetricsService } from "../services/metrics.service"

const router = Router()
const metricsService = MetricsService.getInstance()

// Endpoint to get current metrics
router.get("/", (req, res) => {
  const metrics = metricsService.getMetrics()

  // Add some system metrics
  metrics.memory_usage_mb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  metrics.uptime_seconds = Math.round(process.uptime())

  res.status(200).json(metrics)
})

export default router

