// Email Campaign Integration (SendGrid example)
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendAdEmail(videoUrl: string, subject: string, to: string[]) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject,
    html: `<p>Check out our latest service video ad!</p><video src="${videoUrl}" controls width="400"></video>`
  };
  await sgMail.sendMultiple(msg);
}
