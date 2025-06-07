enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
  }
  
  export class Logger {
    private context: string
  
    constructor(context: string) {
      this.context = context
    }
  
    private log(level: LogLevel, message: string, meta?: any): void {
      const timestamp = new Date().toISOString()
      const logEntry = {
        timestamp,
        level,
        context: this.context,
        message,
        ...(meta ? { meta } : {}),
      }
  
      // In production, you might want to use a proper logging service
      console.log(JSON.stringify(logEntry))
    }
  
    debug(message: string, meta?: any): void {
      this.log(LogLevel.DEBUG, message, meta)
    }
  
    info(message: string, meta?: any): void {
      this.log(LogLevel.INFO, message, meta)
    }
  
    warn(message: string, meta?: any): void {
      this.log(LogLevel.WARN, message, meta)
    }
  
    error(message: string, error?: Error, meta?: any): void {
      this.log(LogLevel.ERROR, message, {
        ...(meta || {}),
        ...(error
          ? {
              error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
              },
            }
          : {}),
      })
    }
  }
