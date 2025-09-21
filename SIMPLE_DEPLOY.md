# 🚀 Super Simple GitHub Auto-Deploy

Forget all that complicated stuff! Here's the EASY way:

## Step 1: Create GitHub Repository (1 minute)

1. Go to [github.com](https://github.com) 
2. Click "New repository"
3. Name it `euroform`
4. Make it public or private (your choice)
5. Click "Create repository"

## Step 2: Push Your Code (1 minute)

Copy these commands from GitHub (they'll look like this):

```bash
git remote add origin https://github.com/YOUR_USERNAME/euroform.git
git branch -M main
git push -u origin main
```

## Step 3: Auto-Deploy Setup on Your Server (5 minutes)

SSH to your server and run this ONE command:

```bash
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/euroform/main/auto-deploy.sh | bash
```

## That's it! 🎉

Now every time you want to update your live site:

```bash
git add .
git commit -m "update"
git push
```

Your server will automatically:
- Pull the latest code
- Build the frontend
- Restart the backend
- Update everything

## No more complicated scripts! 

Just `git push` and you're live! 🚀

---

**Need the auto-deploy script?** I'll create it for you once you have your GitHub repo URL.
