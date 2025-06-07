import type { Request, Response, NextFunction } from "express"
import { Logger } from "../utils/logger"

const logger = new Logger("ErrorHandler")

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  // Default to 500 internal server error
  const statusCode = "statusCode" in err ? err.statusCode : 500
  const isOperational = "isOperational" in err ? err.isOperational : false

  // Log error
  if (statusCode >= 500) {
    logger.error(`Unhandled error: ${err.message}`, err)
  } else {
    logger.warn(`Client error: ${err.message}`, {
      path: req.path,
      method: req.method,
      statusCode,
    })
  }

  // Send response
  res.status(statusCode).json({
    status: "error",
    message: isOperational ? err.message : "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}
