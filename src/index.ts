import { createApp } from './app';
import { env } from './utils/env';
import prisma from './models/prisma';

const app = createApp();

async function main(): Promise<void> {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start server
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${env.PORT}/health`);
      console.log(`📚 API base URL: http://localhost:${env.PORT}/api`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        console.log('HTTP server closed');
        await prisma.$disconnect();
        console.log('Database connection closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
