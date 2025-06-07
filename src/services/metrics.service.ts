// A simple metrics service for monitoring system performance
// In production, you would use a proper monitoring solution like Prometheus

export class MetricsService {
    private static instance: MetricsService
    private metrics: Map<string, number>
    private timers: Map<string, number>
  
    private constructor() {
      this.metrics = new Map()
      this.timers = new Map()
    }
  
    public static getInstance(): MetricsService {
      if (!MetricsService.instance) {
        MetricsService.instance = new MetricsService()
      }
      return MetricsService.instance
    }
  
    // Increment a counter metric
    public increment(name: string, value = 1): void {
      const currentValue = this.metrics.get(name) || 0
      this.metrics.set(name, currentValue + value)
    }
  
    // Set a gauge metric
    public gauge(name: string, value: number): void {
      this.metrics.set(name, value)
    }
  
    // Start a timer
    public startTimer(name: string): void {
      this.timers.set(name, Date.now())
    }
  
    // End a timer and record the duration
    public endTimer(name: string): number {
      const startTime = this.timers.get(name)
      if (!startTime) return 0
  
      const duration = Date.now() - startTime
      this.metrics.set(`${name}_duration_ms`, duration)
      this.timers.delete(name)
      return duration
    }
  
    // Get all metrics
    public getMetrics(): Record<string, number> {
      return Object.fromEntries(this.metrics)
    }
  
    // Reset all metrics
    public resetMetrics(): void {
      this.metrics.clear()
      this.timers.clear()
    }
  }
