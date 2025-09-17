// Admin Analytics Dashboard for Ad Campaigns
'use client';
import React, { useEffect, useState } from 'react';

interface AdEvent {
  type: string;
  adId: string;
  channel?: string;
  email?: string;
  platform?: string;
  metric?: string;
  value?: number;
  timestamp: string;
}

export default function AdAnalyticsDashboard() {
  const [events, setEvents] = useState<AdEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch analytics events from API
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Ad Campaign Analytics</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Type</th>
            <th className="border px-2 py-1">Ad ID</th>
            <th className="border px-2 py-1">Channel/Platform</th>
            <th className="border px-2 py-1">Email</th>
            <th className="border px-2 py-1">Metric</th>
            <th className="border px-2 py-1">Value</th>
            <th className="border px-2 py-1">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 && <tr><td colSpan={7} className="text-center">No analytics data yet.</td></tr>}
          {events.map((e, i) => (
            <tr key={i}>
              <td className="border px-2 py-1">{e.type}</td>
              <td className="border px-2 py-1">{e.adId}</td>
              <td className="border px-2 py-1">{e.channel || e.platform || '-'}</td>
              <td className="border px-2 py-1">{e.email || '-'}</td>
              <td className="border px-2 py-1">{e.metric || '-'}</td>
              <td className="border px-2 py-1">{e.value ?? '-'}</td>
              <td className="border px-2 py-1">{new Date(e.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
