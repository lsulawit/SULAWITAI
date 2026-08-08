export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' });

  try {
    const { text, sourceLanguage='Auto Detect', targetLanguage='English', tone='natural', context=[] } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Missing text' });
    if (text.length > 4000) return res.status(400).json({ error: 'Text is too long' });

    const toneGuide = {
      natural: 'natural, fluent, native-like',
      formal: 'formal, polished, professional',
      casual: 'casual, warm, conversational',
      literal: 'faithful and close to the original meaning without unnecessary rewriting'
    }[tone] || 'natural and fluent';

    const recentContext = Array.isArray(context)
      ? context.slice(-6).map(m => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${String(m.content || '').slice(0,700)}`).join('\n')
      : '';

    const prompt = `You are SULAWIT AI, a translation specialist.\nTranslate the user's text from ${sourceLanguage} to ${targetLanguage}.\nStyle: ${toneGuide}.\nPreserve names, numbers, formatting, intent, nuance, and implied meaning.\nDo not explain unless an explanation is necessary to avoid ambiguity.\nIf the target is Chinese, include natural Chinese first; add pinyin on the next line only when useful for a learner.\nReturn only the translation unless the user explicitly asks for an explanation.\n\nConversation context (for pronouns/meaning only):\n${recentContext || '(none)'}\n\nText to translate:\n${text}`;

    const apiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5',
        input: prompt,
        store: false
      })
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error('OpenAI error', data);
      return res.status(apiResponse.status).json({ error: data?.error?.message || 'AI request failed' });
    }

    const translation = data.output_text || (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === 'output_text')
      .map(item => item.text)
      .join('\n')
      .trim();

    if (!translation) return res.status(502).json({ error: 'No translation returned' });
    return res.status(200).json({ translation });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
