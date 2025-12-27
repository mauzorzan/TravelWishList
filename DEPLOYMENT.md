# 🚀 Travel Wishlist Deployment Guide

## Quick Deploy to Vercel (5 minutes)

### Step 1: Prepare Your Code

Make sure all your changes are committed to Git:

```bash
git init
git add .
git commit -m "Travel wishlist app with interactive map"
```

### Step 2: Push to GitHub

1. Create a new repository on [GitHub](https://github.com/new)
2. Push your code:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 3: Deploy on Vercel

**Option A: Using Vercel Dashboard (Easiest)**

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js - no configuration needed!
5. Click "Deploy"
6. Wait 2-3 minutes for initial deploy

**Option B: Using Vercel CLI**

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts and your app will be deployed!

### Step 4: Set Up Database (Required!)

The app uses Vercel Postgres for storing your travel destinations.

1. In your Vercel project dashboard:
   - Go to "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Click "Continue" and follow the setup

2. The database will be automatically connected to your project

3. Redeploy your app:
   - Go to "Deployments" tab
   - Click the three dots on the latest deployment
   - Click "Redeploy"

The app will automatically create the `travel_destinations` table with this schema:

```sql
CREATE TABLE IF NOT EXISTS travel_destinations (
  id SERIAL PRIMARY KEY,
  rank INTEGER NOT NULL,
  destination TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  reason TEXT NOT NULL,
  budget TEXT NOT NULL,
  timeline TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Step 5: Access Your App

After deployment, Vercel will give you a URL like:
```
https://your-travel-wishlist.vercel.app
```

## 🗺️ amCharts License

The app uses amCharts 4 for the interactive map. For personal use, you can use the free version which shows a small amCharts logo.

For commercial use or to remove the logo, get a license at [amcharts.com](https://www.amcharts.com/online-store/)

Add your license keys in `app/components/WorldMap.tsx`:

```typescript
am4core.addLicense("CH_YOUR_LICENSE");
am4core.addLicense("MP_YOUR_LICENSE");
```

## 🌍 Testing Your Deployment

1. Open your deployed URL
2. Add a test destination:
   - Destination: "Tokyo"
   - Country: "Japan"
   - Latitude: 35.6762
   - Longitude: 139.6503
3. Watch the plane animate from San Francisco!
4. Try reordering, editing, and deleting

## 🔄 Updating Your Deployed App

Whenever you make changes:

```bash
git add .
git commit -m "Your change description"
git push
```

Vercel will automatically rebuild and redeploy!

## 🛠️ Troubleshooting

### Map not showing
- Check browser console for amCharts errors
- Ensure the page has finished loading
- Try refreshing the page

### "Module not found" errors
- Make sure all dependencies are in `package.json`
- Run `npm install` locally first
- Commit `package-lock.json`

### Database connection errors
- Verify Postgres database is created in Vercel Storage
- Check that database is linked to your project
- Try redeploying after creating the database

### Build fails
- Check build logs in Vercel dashboard
- Try building locally first: `npm run build`
- Ensure no TypeScript errors

### Plane animation not working
- Make sure destination coordinates are valid
- Check that a destination is selected
- Verify the map has finished loading

## 🌐 Custom Domain (Optional)

1. Go to your Vercel project → Settings → Domains
2. Add your domain
3. Follow DNS setup instructions
4. Wait for SSL certificate (automatic)

## 📊 Monitoring

Vercel provides:
- **Analytics**: Usage stats
- **Logs**: Runtime logs
- **Speed Insights**: Performance metrics

Access from your project dashboard!

## 🔐 Environment Variables

For local development, create `.env.local`:

```env
# These are automatically set when you create a Vercel Postgres database
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NO_SSL="..."
POSTGRES_URL_NON_POOLING="..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

---

## Need Help?

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Postgres Guide](https://vercel.com/docs/storage/vercel-postgres)
- [amCharts Docs](https://www.amcharts.com/docs/v4/)

---

Happy travels! ✈️🌏
