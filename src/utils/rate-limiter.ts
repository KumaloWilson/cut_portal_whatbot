import type { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory rate limiting (for production, use Redis)
const ipLimits: Map<string, RateLimitRecord> = new Map();

export const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    // Get existing record or create new one
    const record = ipLimits.get(ip) || { count: 0, resetTime: now + windowMs };

    // Reset if window has passed
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    // Update record
    ipLimits.set(ip, record);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count).toString());
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000).toString());

    // Check if rate limit exceeded
    if (record.count > maxRequests) {
      res.status(429).json({
        status: "error",
        message: "Too many requests, please try again later.",
      });
      return; // Ensure no further middleware is executed
    }

    next(); // Proceed to the next middleware
  };
};
