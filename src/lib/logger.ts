import crypto from 'crypto';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

type SerializedError = {
  name?: string;
  message: string;
  stack?: string;
};

function serializeError(err: unknown): SerializedError {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  if (typeof err === 'string') return { message: err };
  return { message: 'Unknown error' };
}

function writeLog(level: LogLevel, message: string, context: LogContext, err?: unknown): void {
  const payload: Record<string, unknown> = {
    level,
    msg: message,
    time: new Date().toISOString(),
    ...context,
  };

  if (err) payload.err = serializeError(err);

  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function createLogger(base: LogContext = {}) {
  return {
    debug: (message: string, context: LogContext = {}) =>
      writeLog('debug', message, { ...base, ...context }),
    info: (message: string, context: LogContext = {}, err?: unknown) =>
      writeLog('info', message, { ...base, ...context }, err),
    warn: (message: string, context: LogContext = {}, err?: unknown) =>
      writeLog('warn', message, { ...base, ...context }, err),
    error: (message: string, context: LogContext = {}, err?: unknown) =>
      writeLog('error', message, { ...base, ...context }, err),
  };
}

export function getRequestId(req: Request): string {
  return req.headers.get('x-request-id') ?? crypto.randomUUID();
}
