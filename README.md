# SULAWIT AI Translator Chat

Responsive AI translation chat designed for iPhone, Android, iPad and desktop.

## Features
- Premium dark glass / neon UI
- CSS 3D animated orb and floating language chips
- Mobile + iPad responsive layouts
- Auto-detect / 18 target languages
- Natural / formal / casual / literal translation tone
- Chat history saved locally
- Speech-to-text (where browser supports it)
- Text-to-speech for translations
- Copy translation
- Focus mode
- Server-side OpenAI integration via `/api/translate`
- Graceful demo mode if API is not configured

## Deploy on Vercel
1. Upload this folder to a GitHub repo or import the project directly into Vercel.
2. In Vercel → Project Settings → Environment Variables, add:
   - `OPENAI_API_KEY` = your API key
   - optional: `OPENAI_MODEL` = `gpt-5`
3. Redeploy.

Important: do not put the API key in `app.js` or any client-side file.
