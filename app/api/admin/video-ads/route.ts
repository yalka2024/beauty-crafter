// API route for video ads admin (list, approve, reject)
import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '../../../../scripts/rbac-middleware';
import { withAuditLogging } from '../../../../scripts/audit-logging-middleware';
import { launchAdCampaign } from '@/lib/ads/distribute';
import { postVideoToFacebook } from '@/lib/ads/facebook-api';
import { sendAdEmail } from '@/lib/ads/email-campaign';
import { logAdEvent, trackAdView, trackAdClick, trackEmailOpen, trackSocialEngagement } from '@/lib/ads/ad-analytics';
import { notifyAdmin } from '@/lib/notifications/admin-notify';
import { alertOnError } from '@/lib/notifications/error-alert';
import { notifySlack } from '@/lib/notifications/slack-notify';
import { notifySMS } from '@/lib/notifications/sms-notify';
import { sendGAEvent } from '@/lib/ads/advanced-analytics';

// TODO: Replace with real DB/storage
let videoAds = [
  {
    id: '1',
    videoUrl: 'https://example.com/video1.mp4',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json(videoAds);
}

const postHandler = async (request: NextRequest) => {
  const { id, action } = await request.json();
  videoAds = videoAds.map(ad => ad.id === id ? { ...ad, status: action } : ad);

  // If approved, launch ad campaign automatically
  if (action === 'approved') {
    const ad = videoAds.find(ad => ad.id === id);
    if (ad) {
      // Log ad approval event (enterprise audit)
      await logAdEvent({ type: 'ad_approved', adId: ad.id, videoUrl: ad.videoUrl, timestamp: new Date().toISOString() });
      await fetch('/api/admin/ad-analytics', { method: 'POST', body: JSON.stringify({ type: 'ad_approved', adId: ad.id, videoUrl: ad.videoUrl, timestamp: new Date().toISOString() }), headers: { 'Content-Type': 'application/json' } });
      await notifyAdmin('Ad Approved', `Ad ${ad.id} has been approved and is being distributed.`);
      await notifySlack('#ad-ops', `Ad ${ad.id} approved and distributed: ${ad.videoUrl}`);
      await notifySMS('+1234567890', `Ad ${ad.id} approved and distributed.`); // Example admin number
      await sendGAEvent({ name: 'ad_approved', ad_id: ad.id, video_url: ad.videoUrl, timestamp: new Date().toISOString() });
      // Launch to Facebook
      try {
        await postVideoToFacebook(ad.videoUrl, 'Check out our latest beauty service!');
        await trackSocialEngagement(ad.id, 'facebook', 'post', 1);
        await fetch('/api/admin/ad-analytics', { method: 'POST', body: JSON.stringify({ type: 'social_engagement', adId: ad.id, platform: 'facebook', metric: 'post', value: 1, timestamp: new Date().toISOString() }), headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        await alertOnError('Facebook post failed', e);
        await notifySlack('#ad-ops', `❗ Facebook post failed for ad ${ad.id}: ${e}`);
        await notifySMS('+1234567890', `Facebook post failed for ad ${ad.id}`);
      }
      // Launch to email subscribers (example list)
      try {
        await sendAdEmail(ad.videoUrl, 'New Beauty Crafter Service Video!', ['customer1@example.com', 'customer2@example.com']);
        await trackEmailOpen(ad.id, 'customer1@example.com');
        await trackEmailOpen(ad.id, 'customer2@example.com');
        await fetch('/api/admin/ad-analytics', { method: 'POST', body: JSON.stringify({ type: 'email_open', adId: ad.id, email: 'customer1@example.com', timestamp: new Date().toISOString() }), headers: { 'Content-Type': 'application/json' } });
        await fetch('/api/admin/ad-analytics', { method: 'POST', body: JSON.stringify({ type: 'email_open', adId: ad.id, email: 'customer2@example.com', timestamp: new Date().toISOString() }), headers: { 'Content-Type': 'application/json' } });

      } catch (e) {
        await alertOnError('Email campaign failed', e);
        await notifySlack('#ad-ops', `❗ Email campaign failed for ad ${ad.id}: ${e}`);
      }
      // Launch in-app (stub)
      try {
        await trackAdView(ad.id, 'in-app');
        await fetch('/api/admin/ad-analytics', { method: 'POST', body: JSON.stringify({ type: 'ad_view', adId: ad.id, channel: 'in-app', timestamp: new Date().toISOString() }), headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        await alertOnError('In-app campaign failed', e);
        await notifySlack('#ad-ops', `❗ In-app campaign failed for ad ${ad.id}: ${e}`);
      }
    }
  }
  return NextResponse.json({ success: true });
};

// Enterprise: Require admin RBAC and audit logging for POST
export const POST = withRBAC(withAuditLogging(postHandler, 'admin_video_ad_action'), 'admin');
