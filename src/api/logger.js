// lib/logger.js
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard', // para que muestre tiempo legible
      ignore: 'pid,hostname'         // para no mostrar info que no te interesa
    },
  },
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

export default logger;
