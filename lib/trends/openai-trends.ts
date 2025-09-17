// OpenAI Trend Analyzer
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

export async function summarizeTrends(rawTrends: string[]): Promise<string> {
  const prompt = `Summarize the following beauty/service trends for a monthly customer newsletter. Highlight actionable insights and local relevance.\n\nTrends:\n${rawTrends.join('\n')}`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 400,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || '';
}
