# ✈️ Travel Wishlist

A beautiful, interactive travel wishlist app that helps you plan and visualize your dream destinations from San Francisco.

![Travel Wishlist](https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&h=400&fit=crop)

## ✨ Features

- **Interactive World Map** - Powered by amCharts with animated flight paths from San Francisco
- **Ranked Destinations** - Drag and reorder your travel priorities
- **Rich Destination Details**:
  - 📍 Location with coordinates
  - 💰 Budget estimation (from Budget to Ultra Luxury)
  - 🗓️ Timeline planning
  - ✍️ Personal reasons to visit
  - 🖼️ Custom destination images
- **Stunning Dark Theme** - Modern, atmospheric design
- **Animated Plane** - Watch flights animate from SF to your selected destination
- **Responsive Design** - Works beautifully on desktop and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Vercel account (for deployment)

### Local Development

1. Clone the repository:

```bash
git clone <your-repo-url>
cd Wishlist
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Database Setup

The app uses Vercel Postgres for data persistence. For local development, you'll need to:

1. Create a Vercel Postgres database in your Vercel dashboard
2. Link it to your project or add the connection strings to a `.env.local` file:

```env
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NO_SSL="..."
POSTGRES_URL_NON_POOLING="..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

## 🌍 Adding Destinations

1. Click "Add Destination"
2. Enter the city/destination name (e.g., "Tokyo", "Machu Picchu")
3. Enter the country (e.g., "Japan", "Peru")
4. **Coordinates are found automatically!** 🎉
5. Select your budget range and timeline
6. Add your personal reason for wanting to visit
7. Optionally add an image URL
8. Click "Add to Wishlist"

### Automatic Geocoding

The app uses OpenStreetMap's Nominatim API to automatically find coordinates:

- Just type the city and country
- Watch for the ✅ confirmation when the location is found
- If the location isn't found, try a different spelling or nearby city

## 🗺️ Using the Map

- **Click on markers** to select a destination
- **Watch the plane animate** from San Francisco to your selected destination
- **Use zoom controls** on the right side of the map
- **Click the home button** to reset the view

## 💻 Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Vercel Postgres
- **Maps**: amCharts 4
- **Deployment**: Vercel

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deploy

1. Push your code to GitHub
2. Import your repo in [Vercel](https://vercel.com)
3. Create a Postgres database in Vercel Storage
4. Deploy!

## 📁 Project Structure

```
Wishlist/
├── app/
│   ├── api/
│   │   └── wishlist/
│   │       ├── route.ts          # GET, POST, PATCH endpoints
│   │       └── [id]/
│   │           └── route.ts      # GET, PUT, DELETE endpoints
│   ├── components/
│   │   └── WorldMap.tsx          # amCharts interactive map
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main app page
├── lib/
│   └── db.ts                     # Database operations
├── public/                       # Static assets
├── package.json
└── README.md
```

## 🎨 Customization

### Change Origin City

Edit the `SF_COORDS` constant in `app/components/WorldMap.tsx`:

```typescript
const SF_COORDS = {
  latitude: 37.7749,
  longitude: -122.4194,
  title: "San Francisco",
};
```

### Add Budget Options

Edit `BUDGET_OPTIONS` in `app/page.tsx`:

```typescript
const BUDGET_OPTIONS = [
  { value: "budget", label: "💰 Budget ($500-1,500)", color: "bg-emerald-500" },
  // Add more options...
];
```

### Modify Timeline Options

Edit `TIMELINE_OPTIONS` in `app/page.tsx`:

```typescript
const TIMELINE_OPTIONS = [
  { value: "2025-q1", label: "🌸 Q1 2025 (Jan-Mar)" },
  // Add more options...
];
```

## 📝 License

MIT License - feel free to use this for your own travel planning!

## 🙏 Acknowledgments

- [amCharts](https://www.amcharts.com/) for the beautiful map library
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vercel](https://vercel.com/) for hosting and database

---

Made with ❤️ for dreamers and travelers

Happy travels! ✈️🌏
