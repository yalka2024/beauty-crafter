// Admin UI for Video Ad Review/Approval
'use client';
import React, { useEffect, useState } from 'react';

interface VideoAd {
  id: string;
  videoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function VideoAdsAdminPage() {
  const [ads, setAds] = useState<VideoAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch video ads from API
    setLoading(false);
  }, []);

  const handleApprove = (id: string) => {
    // TODO: Approve ad via API
    setAds(ads => ads.map(ad => ad.id === id ? { ...ad, status: 'approved' } : ad));
  };
  const handleReject = (id: string) => {
    // TODO: Reject ad via API
    setAds(ads => ads.map(ad => ad.id === id ? { ...ad, status: 'rejected' } : ad));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Video Ads Review & Approval</h1>
      <div className="space-y-6">
        {ads.length === 0 && <div>No video ads pending review.</div>}
        {ads.map(ad => (
          <div key={ad.id} className="border rounded p-4 flex flex-col md:flex-row items-center gap-4">
            <video src={ad.videoUrl} controls className="w-64 h-36 bg-black" />
            <div className="flex-1">
              <div>Status: <span className={ad.status === 'pending' ? 'text-yellow-600' : ad.status === 'approved' ? 'text-green-600' : 'text-red-600'}>{ad.status}</span></div>
              <div>Created: {new Date(ad.createdAt).toLocaleString()}</div>
              <div className="mt-2 flex gap-2">
                {ad.status === 'pending' && <>
                  <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => handleApprove(ad.id)}>Approve</button>
                  <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => handleReject(ad.id)}>Reject</button>
                </>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
