# EMBER AI Upgrade

A mobile-friendly Kurama-inspired AI assistant frontend for GitHub Pages, plus a Cloudflare Worker backend example.

## Files
- `index.html`, `style.css`, `script.js`: upload/commit these to the root of your GitHub Pages repository.
- `worker.js`: deploy this separately to your Cloudflare Worker. Do not upload it as a public website file unless you intentionally want the source public.

## Before publishing
1. In `script.js`, replace `PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE` with the base URL of your deployed Worker, e.g. `https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev`. Do not append `/chat`.
2. In Cloudflare Worker secrets, keep the secret named `GEMINI_API_KEY`. Never paste the key into frontend files or GitHub.
3. The Worker allows the GitHub Pages origin `https://narutouzumaki-dot.github.io`. Keep this origin in `ALLOWED_ORIGINS`; CORS origins do not include the repository path.
4. Deploy the Worker.
5. Commit `index.html`, `style.css`, and `script.js` to the root of the GitHub repository.
6. Open your Pages website and test the AI connection and chat.

## Features
- Kurama-inspired animated eye and red/black UI
- Responsive desktop/mobile navigation
- AI chat with optional local chat history
- Voice input via browser speech recognition and optional spoken replies
- Text file analysis for TXT/MD/CSV/JSON/JS/CSS/HTML/PY/XML/LOG
- Study mode and coding assistant prompts
- Backend health check

## Limitations and security
- Browser voice recognition support varies. It is not an always-on wake-word service.
- File analysis currently supports text files, not PDFs or images.
- Chat history is stored in local browser storage only if enabled. Do not use it on shared devices.
- CORS is not authentication. Add rate limits/usage controls to a public Worker before sharing widely.
