// Trends Worker: Fetches, analyzes, and stores trends
import { fetchTrends } from './trends-fetcher';
import { analyzeTrends } from './trends-analyzer';
import { storeTrends } from './trends-storage';
import { logTrendEvent } from './trends-logger';

export async function fetchAndStoreTrends() {
  // 1. Fetch raw trends data
  const rawTrends = await fetchTrends();
  // 2. Analyze and summarize
  const analyzed = await analyzeTrends(rawTrends);
  // 3. Store for recommendations
  await storeTrends(analyzed);
  // 4. Log event
  await logTrendEvent({ type: 'trends_fetched', count: analyzed.length });
}
