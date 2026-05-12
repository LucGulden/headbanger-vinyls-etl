/**
 * Pino logger shared by every part. Pretty-printed in dev to be readable
 * in a terminal; switch the transport target away from `pino-pretty` if
 * you want raw JSON for log aggregation later.
 */
import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

export type Logger = typeof logger;