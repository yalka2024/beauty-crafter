// SMS Notification Integration (Twilio example)
import twilio from 'twilio';

let client: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }
    
    client = twilio(accountSid, authToken);
  }
  
  return client;
}

export async function notifySMS(to: string, message: string) {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) throw new Error('Twilio phone number not set');
  
  try {
    const twilioClient = getTwilioClient();
    await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to,
    });
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw error;
  }
}
