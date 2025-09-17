// AWS Polly Voiceover Generator
import AWS from 'aws-sdk';
const polly = new AWS.Polly({ region: process.env.AWS_REGION || 'us-east-1' });

export async function generateVoiceover(text: string): Promise<Buffer> {
  const params = {
    OutputFormat: 'mp3',
    Text: text,
    VoiceId: 'Joanna', // Or another supported voice
    Engine: 'neural',
  };
  const result = await polly.synthesizeSpeech(params).promise();
  if (result.AudioStream instanceof Buffer) {
    return result.AudioStream;
  }
  throw new Error('Polly did not return audio stream');
}
