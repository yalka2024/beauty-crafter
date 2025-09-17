// Video Ad Storage: Uploads video to S3
import AWS from 'aws-sdk';
const s3 = new AWS.S3();

export async function uploadToS3(videoBuffer: Buffer): Promise<string> {
  // TODO: Configure S3 bucket and credentials
  const params = {
    Bucket: process.env.ADS_S3_BUCKET || 'beauty-crafter-ads',
    Key: `video-ads/ad-${Date.now()}.mp4`,
    Body: videoBuffer,
    ContentType: 'video/mp4',
    ACL: 'public-read',
  };
  const result = await s3.upload(params).promise();
  return result.Location;
}
