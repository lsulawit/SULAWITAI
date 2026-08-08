const LANGUAGE_CODES = {
  'Auto Detect': 'auto',
  'Thai': 'th',
  'English': 'en',
  'Chinese': 'zh-CN',
  'Japanese': 'ja',
  'Korean': 'ko',
  'French': 'fr',
  'German': 'de',
  'Spanish': 'es',
  'Italian': 'it',
  'Portuguese': 'pt',
  'Russian': 'ru',
  'Arabic': 'ar',
  'Vietnamese': 'vi',
  'Indonesian': 'id',
  'Malay': 'ms',
  'Hindi': 'hi',
  'Dutch': 'nl',
  'Turkish': 'tr'
};

function languageCode(name) {
  return LANGUAGE_CODES[name] || String(name || '').trim() || 'en';
}

function detectLanguage(text, target = 'en') {
  // Script-based detection is highly reliable for these languages.
  if (/\p{Script=Thai}/u.test(text)) return 'th';
  if (/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(text)) return 'ja';
  if (/\p{Script=Hangul}/u.test(text)) return 'ko';
  if (/\p{Script=Arabic}/u.test(text)) return 'ar';
  if (/\p{Script=Devanagari}/u.test(text)) return 'hi';
  if (/\p{Script=Cyrillic}/u.test(text)) return 'ru';
  if (/\p{Script=Han}/u.test(text)) return 'zh-CN';

  const s = ` ${text.toLowerCase()} `;
  const scores = {
    vi: /[ÄÃ¢ÄÃªÃ´Æ¡Æ°Ã Ã¡áº£Ã£áº¡Ã¨Ã©áº»áº½áº¹Ã¬Ã­á»Ä©á»Ã²Ã³á»Ãµá»Ã¹Ãºá»§Å©á»¥á»³Ã½á»·á»¹á»µ]/i.test(text) ? 8 : 0,
    tr: /[ÄÄ±ÅÃ§Ã¶Ã¼]/i.test(text) ? 5 : 0,
    es: /[Â¿Â¡Ã±]/i.test(text) ? 5 : 0,
    fr: /[Ã Ã¢Ã§Ã©Ã¨ÃªÃ«Ã®Ã¯Ã´Ã»Ã¹Ã¼Ã¿Å]/i.test(text) ? 4 : 0,
    de: /[Ã¤Ã¶Ã¼Ã]/i.test(text) ? 4 : 0,
    pt: /[Ã£ÃµÃ§Ã¡Ã¢Ã Ã©ÃªÃ­Ã³Ã´Ãº]/i.test(text) ? 3 : 0,
    it: 0, nl: 0, id: 0, ms: 0, en: 0
  };

  const words = {
    es: [' el ',' la ',' los ',' las ',' una ',' un ',' que ',' por ',' para ',' gracias ',' hola ',' estoy ',' tengo ',' quiero '],
    fr: [' le ',' la ',' les ',' une ',' des ',' que ',' pour ',' merci ',' bonjour ',' suis ',' avec ',' je ',' vous '],
    de: [' der ',' die ',' das ',' und ',' ist ',' nicht ',' danke ',' hallo ',' ich ',' mit ',' fÃ¼r ',' ein '],
    pt: [' o ',' a ',' os ',' as ',' uma ',' que ',' para ',' obrigado ',' olÃ¡ ',' estou ',' vocÃª ',' com '],
    it: [' il ',' lo ',' la ',' gli ',' una ',' che ',' per ',' grazie ',' ciao ',' sono ',' con ',' io '],
    nl: [' de ',' het ',' een ',' en ',' niet ',' dank ',' hallo ',' ik ',' met ',' voor ',' je '],
    id: [' yang ',' dan ',' tidak ',' saya ',' kamu ',' untuk ',' dengan ',' terima kasih ',' selamat '],
    ms: [' yang ',' dan ',' tidak ',' saya ',' awak ',' untuk ',' dengan ',' terima kasih ',' selamat '],
    tr: [' bir ',' ve ',' deÄil ',' ben ',' sen ',' iÃ§in ',' ile ',' teÅekkÃ¼r ',' merhaba '],
    vi: [' tÃ´i ',' báº¡n ',' khÃ´ng ',' vÃ  ',' cá»§a ',' cho ',' cáº£m Æ¡n ',' xin chÃ o '],
    en: [' the ',' a ',' an ',' and ',' is ',' are ',' i ',' you ',' thank ',' hello ',' with ',' for ',' to ']
  };
  for (const [code, list] of Object.entries(words)) {
    for (const w of list) if (s.includes(w)) scores[code] = (scores[code] || 0) + 1;
  }
  const best = Object.entries(scores).sort((a,b) => b[1] - a[1])[0];
  if (best && best[1] > 0) return best[0];

  // Plain Latin text is most commonly English. If target is English and we
  // cannot identify the source confidently, Spanish is a more useful fallback
  // than en|en; users can still choose the exact source language in the UI.
  return target === 'en' ? 'es' : 'en';
}

function byteLength(str) {
  return new TextEncoder().encode(str).length;
}

function splitForMyMemory(text, maxBytes = 450) {
  const result = [];
  let chunk = '';
  const parts = text.split(/(\n+|(?<=[.!?ãï¼ï¼])\s+)/u);

  const pushChunk = () => {
    if (chunk) result.push(chunk);
    chunk = '';
  };

  for (const part of parts) {
    if (!part) continue;
    if (byteLength(chunk + part) <= maxBytes) {
      chunk += part;
      continue;
    }
    pushChunk();
    if (byteLength(part) <= maxBytes) {
      chunk = part;
      continue;
    }
    let small = '';
    for (const char of part) {
      if (byteLength(small + char) > maxBytes) {
        if (small) result.push(small);
        small = char;
      } else small += char;
    }
    chunk = small;
  }
  pushChunk();
  return result.filter(Boolean);
}

function decodeEntities(str = '') {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

async function translateWithMyMemory(text, sourceCode, targetCode) {
  if (sourceCode === targetCode) return text;
  const chunks = splitForMyMemory(text);
  if (chunks.length > 12) throw new Error('à¸à¹à¸­à¸à¸§à¸²à¸¡à¸¢à¸²à¸§à¹à¸à¸´à¸à¹à¸à¸ªà¸³à¸«à¸£à¸±à¸à¹à¸«à¸¡à¸à¸à¸£à¸µ à¸à¸£à¸¸à¸à¸²à¹à¸à¹à¸à¸à¹à¸­à¸à¸§à¸²à¸¡à¹à¸«à¹à¸ªà¸±à¹à¸à¸¥à¸');

  const translated = [];
  for (const chunk of chunks) {
    const params = new URLSearchParams({
      q: chunk,
      langpair: `${sourceCode}|${targetCode}`,
      mt: '1'
    });
    if (process.env.MYMEMORY_EMAIL) params.set('de', process.env.MYMEMORY_EMAIL);

    const r = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
      headers: { 'Accept': 'application/json' }
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.responseDetails || 'à¸à¸£à¸´à¸à¸²à¸£à¹à¸à¸¥à¸à¸£à¸µà¹à¸¡à¹à¸à¸£à¹à¸­à¸¡à¹à¸à¹à¸à¸²à¸');

    const output = data?.responseData?.translatedText;
    const details = String(data?.responseDetails || '');
    if (!output || /quota|limit|available free translation/i.test(details + ' ' + output)) {
      throw new Error('à¹à¸à¸§à¸à¸²à¹à¸à¸¥à¸à¸£à¸µà¸§à¸±à¸à¸à¸µà¹à¸«à¸¡à¸à¹à¸¥à¹à¸§ à¸à¸£à¸¸à¸à¸²à¸¥à¸­à¸à¹à¸«à¸¡à¹à¸ à¸²à¸¢à¸«à¸¥à¸±à¸');
    }
    translated.push(decodeEntities(output));
  }
  return translated.join('');
}

async function translateWithOpenAI({ text, sourceLanguage, targetLanguage, tone, context }) {
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
  if (!apiResponse.ok) throw new Error(data?.error?.message || 'AI request failed');

  const translation = data.output_text || (data.output || [])
    .flatMap(item => item.content || [])
    .filter(item => item.type === 'output_text')
    .map(item => item.text)
    .join('\n')
    .trim();

  if (!translation) throw new Error('No translation returned');
  return translation;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, sourceLanguage='Auto Detect', targetLanguage='English', tone='natural', context=[] } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'à¸à¸£à¸¸à¸à¸²à¹à¸ªà¹à¸à¹à¸­à¸à¸§à¸²à¸¡à¸à¸µà¹à¸à¹à¸­à¸à¸à¸²à¸£à¹à¸à¸¥' });
    if (text.length > 4000) return res.status(400).json({ error: 'à¸à¹à¸­à¸à¸§à¸²à¸¡à¸¢à¸²à¸§à¹à¸à¸´à¸ 4,000 à¸à¸±à¸§à¸­à¸±à¸à¸©à¸£' });

    // Optional premium AI mode: if an OpenAI key exists, use it automatically.
    if (process.env.OPENAI_API_KEY) {
      const translation = await translateWithOpenAI({ text, sourceLanguage, targetLanguage, tone, context });
      return res.status(200).json({ translation, engine: 'openai' });
    }

    // Free mode: no API key required.
    let targetCode = languageCode(targetLanguage);
    let sourceCode = languageCode(sourceLanguage);
    if (sourceCode === 'auto') sourceCode = detectLanguage(text, targetCode);
    if (!targetCode || targetCode === 'auto') targetCode = 'en';

    const translation = await translateWithMyMemory(text, sourceCode, targetCode);
    return res.status(200).json({ translation, engine: 'free', detectedLanguage: sourceCode });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: error?.message || 'à¹à¸¡à¹à¸ªà¸²à¸¡à¸²à¸£à¸à¹à¸à¸¥à¹à¸à¹à¹à¸à¸à¸à¸°à¸à¸µà¹' });
  }
}
