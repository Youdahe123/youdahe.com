# Vercel Path Reference

## How Paths Work on Vercel

### Static Files (Served from CDN)
All files in the root directory are automatically served as static files:

```
https://your-domain.vercel.app/index.html
https://your-domain.vercel.app/contacts.html
https://your-domain.vercel.app/styles.css
https://your-domain.vercel.app/chatbot.js
https://your-domain.vercel.app/script.js
https://your-domain.vercel.app/pics/IMG_2458.jpeg
https://your-domain.vercel.app/vids/IMG_3299.mov
```

### Serverless Functions (Dynamic)
Files in the `/api` directory become serverless endpoints:

```
/api/chat.js  →  https://your-domain.vercel.app/api/chat
```

## Current Setup

### Frontend → Backend Communication
```javascript
// chatbot.js (line 8)
const API_ENDPOINT = '/api/chat';  ✅ CORRECT

// This calls: https://your-domain.vercel.app/api/chat
// Which executes: /api/chat.js serverless function
```

### How It Works
1. User types message in chat
2. Frontend sends POST to `/api/chat`
3. Vercel routes to `/api/chat.js` serverless function
4. Function calls OpenAI API (with your key from env vars)
5. Response returns to frontend
6. Chat displays the message

## Caching Strategy (vercel.json)
```json
{
  "headers": [
    // API calls: No cache (always fresh)
    { "source": "/api/(.*)", "Cache-Control": "s-maxage=0" },

    // Static files: Cache forever (CDN)
    { "source": "/(.*)", "Cache-Control": "max-age=31536000" }
  ]
}
```

## File Structure
```
Root (Static - CDN)
├── index.html
├── contacts.html (chatbot page)
├── experience.html
├── projects.html
├── photography.html
├── styles.css
├── chatbot.js         ← Frontend code
├── script.js          ← Dark mode toggle
├── pics/              ← Images (CDN)
├── vids/              ← Videos (CDN)
└── api/               ← Serverless Functions
    └── chat.js        ← AI endpoint
```

## Testing Paths

### Local Development
```bash
npm start
# Or with Vercel CLI:
vercel dev
```

```
http://localhost:3000/          → index.html
http://localhost:3000/contacts.html → chatbot page
http://localhost:3000/api/chat  → serverless function
```

### Production (After Deploy)
```
https://your-domain.vercel.app/
https://your-domain.vercel.app/contacts.html
https://your-domain.vercel.app/api/chat
```

## Troubleshooting

**Chatbot not working?**
- Check browser console for API errors
- Verify `/api/chat` is returning 200 (not 404)
- Check Vercel dashboard → Functions → Logs

**404 on /api/chat?**
- Ensure `/api/chat.js` exists
- Check Vercel dashboard → Deployments → Building

**Static files not loading?**
- Check paths are relative (not absolute)
- Verify files are in root directory
- Check `.vercelignore` isn't excluding them

## All Paths Are Correct ✅

Your setup is optimized for Vercel's static hosting + serverless functions!
