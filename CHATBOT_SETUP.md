# Chatbot Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create your `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Add your OpenAI API key to `.env`:**
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   PORT=3000
   ```

   Get your API key from: https://platform.openai.com/api-keys

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000` and click on "talk to youdahe"

## Development Mode

For auto-reload on file changes:
```bash
npm run dev
```

## How It Works

- **Frontend** (`chatbot.js`): Handles the chat UI and sends messages to your backend
- **Backend** (`server.js`): Securely stores your API key and communicates with OpenAI
- **Your info**: All your experience, projects, and personality are embedded in the system prompt

## Deploying

When you're ready to deploy, make sure to:
1. Set the `OPENAI_API_KEY` environment variable on your hosting platform
2. Set `PORT` if your platform requires a specific port
3. Add `.env` to `.gitignore` (already done)

## Cost

The chatbot uses GPT-4o-mini which is very affordable:
- Input: $0.15 per 1M tokens (~750k words)
- Output: $0.60 per 1M tokens (~750k words)

Most conversations will cost less than $0.01
