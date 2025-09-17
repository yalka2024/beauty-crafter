// Script to sync backups to AWS S3 (requires aws-sdk)
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const backupDir = path.join(__dirname, 'backup');
const bucket = process.env.BACKUP_BUCKET;

fs.readdirSync(backupDir).forEach(file => {
  const filePath = path.join(backupDir, file);
  if (fs.statSync(filePath).isFile()) {
    s3.upload({
      Bucket: bucket,
      Key: `db-backups/${file}`,
      Body: fs.createReadStream(filePath),
    }, (err, data) => {
      if (err) console.error('Upload error:', err);
      else console.log('Uploaded:', data.Location);
    });
  }
});
