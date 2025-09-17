// User Dashboard: Market Trends & Recommendations
'use client';
import React, { useEffect, useState } from 'react';

interface Trend {
  summary: string;
  details: string[];
  createdAt: string;
}

export default function TrendsDashboardPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch trends from API
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Market Trends & Recommendations</h1>
      <div className="space-y-6">
        {trends.length === 0 && <div>No trends available yet. Check back soon!</div>}
        {trends.map((trend, idx) => (
          <div key={idx} className="border rounded p-4 bg-white shadow">
            <div className="font-semibold mb-2">{new Date(trend.createdAt).toLocaleDateString()}</div>
            <div className="mb-2">{trend.summary}</div>
            <ul className="list-disc ml-6 text-gray-700">
              {trend.details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
