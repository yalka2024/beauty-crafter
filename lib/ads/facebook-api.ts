// Facebook/Instagram Graph API Integration for Ad Posting

import fetch from 'node-fetch';
import { getSecret } from '../secrets-manager';


export async function postVideoToFacebook(videoUrl: string, caption: string) {
  // Enterprise: Fetch credentials from AWS Secrets Manager
  const pageAccessToken = await getSecret('facebook/page_access_token');
  const pageId = await getSecret('facebook/page_id');
  if (!pageAccessToken || !pageId) throw new Error('Facebook credentials missing');

  // Step 1: Upload video
  const uploadRes = await fetch(`https://graph-video.facebook.com/v19.0/${pageId}/videos?access_token=${pageAccessToken}`, {
    method: 'POST',
    body: new URLSearchParams({
      file_url: videoUrl,
      description: caption,
      published: 'true',
    }),
  });
  const uploadData = await uploadRes.json();
  if (!uploadData.id) throw new Error('Facebook video upload failed');
  return uploadData.id;
}
