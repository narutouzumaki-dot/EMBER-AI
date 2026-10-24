# EMBER AI — All-in-One Feature Upgrade

## Install
1. Download and unzip this package.
2. Open your GitHub repository `EMBER-AI`.
3. Replace the repository-root `index.html`, `style.css`, and `script.js` with these files. Keep your existing Cloudflare Worker deployed separately.
4. Commit changes and wait for GitHub Pages to publish.
5. Open the website and refresh it. If old files remain cached, hard-refresh or clear the site cache.

## Included
- Kurama-inspired responsive dark/red UI and animated eye.
- Gemini chat using your existing Cloudflare Worker endpoint.
- Voice input (browser-supported) and spoken replies.
- Text/code file analysis plus PDF text extraction and image OCR (libraries load from CDNs; internet required).
- Study and coding modes.
- Local display profile (NOT secure authentication; no password is collected).
- Device/browser capability status and settings.

## Important limitations / safety
- `GEMINI_API_KEY` must remain a Cloudflare Worker secret. Never add it to GitHub or frontend JavaScript.
- The profile feature is only a local display name. Real accounts require a trusted authentication provider and server-side access controls.
- A website cannot silently control your whole phone/laptop, launch arbitrary apps, or access private files. This upgrade only reports browser capabilities and uses features you explicitly trigger.
- Voice recognition support varies by browser and usually needs microphone permission. This is tap-to-talk, not always-on wake-word activation.
- PDF/OCR uses third-party CDN libraries and needs internet. Extracted content is sent to your Worker only after you press Analyze. Do not upload sensitive documents.
- Public Workers should use rate limits and usage controls to prevent abuse and unexpected API costs.
