# Deploy to Vercel - Quick Guide

## Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- OpenAI API key (get from https://platform.openai.com/api-keys)

## Deployment Steps

### 1. Push to GitHub (if not already done)
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? youdahe-com (or whatever you prefer)
# - Directory? ./
# - Override settings? No
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect the settings
4. Click "Deploy"

### 3. Add Environment Variable
After deployment, add your API key:

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Environment Variables"
3. Add:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-...` (your actual key)
   - **Environment:** Production, Preview, Development (select all)
4. Click "Save"

### 4. Redeploy
```bash
vercel --prod
```

Or in the Vercel dashboard:
- Go to "Deployments"
- Click the three dots on the latest deployment
- Click "Redeploy"

## Your Live Site
After deployment, your site will be live at:
```
https://your-project-name.vercel.app
```

## Custom Domain (Optional)
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain (e.g., youdahe.com)
4. Follow Vercel's instructions to update your DNS settings

## Testing the Chatbot
1. Visit your deployed site
2. Click "talk to youdahe"
3. Try asking: "what are you working on right now?"

## Troubleshooting

**Chatbot not working?**
- Check that `OPENAI_API_KEY` is set in Vercel dashboard
- Check the Function Logs in Vercel dashboard for errors
- Make sure you redeployed after adding the environment variable

**Want to update the chatbot?**
- Edit `api/chat.js`
- Push to GitHub
- Vercel will automatically redeploy

## Local Development
To test locally before deploying:
```bash
# Install Vercel CLI
npm i -g vercel

# Run locally with Vercel dev server
vercel dev
```

This will run your site locally with the serverless functions, just like on Vercel.

## Cost
- Vercel: Free tier includes unlimited bandwidth and 100GB/month
- OpenAI: GPT-4o-mini is very cheap (~$0.001 per conversation)
- Total: Essentially free for personal use
