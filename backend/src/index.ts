import app from './app';
import { config, validateProductionConfig } from './config';

validateProductionConfig();

const start = async () => {
  try {
    app.listen(config.port, () => {
      console.log(`Luxury Perfumes ERP API running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
