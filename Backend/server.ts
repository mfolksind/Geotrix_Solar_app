import app from './app';
import { connectMongoDB, disconnectMongoDB } from './src/database/mongodb/connection';
import logger from './src/common/logger/logger';
import { env } from './src/config/env';

const PORT = env.PORT;

let server: ReturnType<typeof app.listen> | null = null;

async function startServer(): Promise<void> {
  try {
    // Connect to DB first
    await connectMongoDB();

    server = app.listen(PORT || 4000, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    // handle graceful shutdown signals
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection at Promise', reason);
      // attempt graceful shutdown
      shutdown('unhandledRejection', 1);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught Exception thrown', err);
      shutdown('uncaughtException', 1);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

async function shutdown(reason = 'shutdown', exitCode = 0): Promise<void> {
  try {
    logger.info(`Shutting down server due to ${reason}`);
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    await disconnectMongoDB();
  } catch (err) {
    logger.error('Error during shutdown', err);
    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
}

startServer();
