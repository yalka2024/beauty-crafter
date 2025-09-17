// OpenAI Video Ad Script Generator
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

export async function generateAdScript(serviceList: string[]): Promise<string> {
  const prompt = `Write a 30-second video ad script to promote these beauty services: ${serviceList.join(', ')}. Make it engaging, modern, and suitable for social media.`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.8,
  });
  return response.choices[0]?.message?.content || '';
}
