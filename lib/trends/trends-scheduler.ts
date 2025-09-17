// Niche Research & Market Trend Scheduler
import cron from 'node-cron';
import { fetchAndStoreTrends } from './trends-worker';

// Monthly on the 1st at 2:00 AM
cron.schedule('0 2 1 * *', async () => {
  await fetchAndStoreTrends();
  console.log('[Trends] Monthly trend research triggered.');
});

// Export for manual triggering/testing
export async function triggerTrendsJob() {
  await fetchAndStoreTrends();
}
