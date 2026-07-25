import path from 'path';
import fs from 'fs';
import morgan from 'morgan';
import { createLogger, format, transports } from 'winston';
import { env } from '../../config/env';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors, splat } = format;

const logFormat = printf(({ timestamp: ts, level, message, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} ${level}: ${stack || message}${metaStr}`;
});

const logger = createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(errors({ stack: true }), splat(), timestamp(), logFormat),
  transports: [
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error', maxsize: 5 * 1024 * 1024, maxFiles: 5 }),
    new transports.File({ filename: path.join(logDir, 'combined.log'), level: 'info', maxsize: 5 * 1024 * 1024, maxFiles: 5 }),
  ],
  exitOnError: false,
});

if (env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({ format: combine(colorize(), timestamp(), logFormat) }));
}

export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export const morganMiddleware = morgan('combined', { stream });

export default logger;
