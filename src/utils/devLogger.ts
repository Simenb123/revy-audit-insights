import { logger } from './logger';

export const devLog = (message: string, data?: any) => {
  if (data) {
    logger.debug(message, data);
  } else {
    logger.debug(message);
  }
};

export const devError = (message: string, error?: any) => {
  if (error) {
    logger.error(message, error);
  } else {
    logger.error(message);
  }
};

export const devWarn = (message: string, data?: any) => {
  if (data) {
    logger.warn(message, data);
  } else {
    logger.warn(message);
  }
};

export const devInfo = (message: string, data?: any) => {
  if (data) {
    logger.info(message, data);
  } else {
    logger.info(message);
  }
};
