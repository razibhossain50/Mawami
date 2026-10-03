import { AppDataSource } from './database-seed';
import { seedBulkBiodata, BULK_COUNT } from './seeds/bulk-biodata';

// Usage: npm run database:seed:bulk [-- <count>]
async function run() {
  const count = Number(process.argv[2]) || BULK_COUNT;
  try {
    await AppDataSource.initialize();
    await seedBulkBiodata(AppDataSource, count);
  } catch (error) {
    console.error('❌ Bulk seeding failed:', error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  }
}

void run();
