// Auto Video Ads Generator Scheduler
// Schedules and triggers video ad generation every 2–3 months
import cron from 'node-cron';
import { generateAndLaunchVideoAd } from './video-ads-worker';

// Every 2 months at 10:00 AM on the 1st day
cron.schedule('0 10 1 */2 *', async () => {
  await generateAndLaunchVideoAd();
  console.log('[VideoAds] Auto video ad generation triggered.');
});

// Export for manual triggering/testing
export async function triggerVideoAdJob() {
  await generateAndLaunchVideoAd();
}
