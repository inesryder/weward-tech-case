type LogLevel = "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

function log(level: LogLevel, event: string, context?: LogContext) {
  console.log(`[${level}] ${event}`, context ? JSON.stringify(context) : "");
  // console.log(`[${level}] ${event}`, context ? JSON.stringify(context, null, 2) : ""); // For an indented andmore legible log
}

export const logger = {
  info: (event: string, context?: LogContext) => log("info", event, context),
  warn: (event: string, context?: LogContext) => log("warn", event, context),
  error: (event: string, context?: LogContext) => log("error", event, context),
};
