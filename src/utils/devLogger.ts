import { logger } from './logger';

export const devLog = (message: string, data?: any) => {
  if (data) {
    logger.log(message, data);
  } else {
    logger.log(message);
  }
};

export const devError = (message: string, error?: any) => {
  if (error) {
    logger.error(message, error);
  } else {
    logger.error(message);
  }
};
