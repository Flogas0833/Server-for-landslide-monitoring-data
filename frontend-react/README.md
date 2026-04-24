# React + TanStack Frontend Migration

Complete migration of Landslide Monitoring System frontend from Vanilla JavaScript to **React + TanStack** technologies.

## ✨ Tech Stack

- **React 18.x** - UI Framework
- **TanStack Query** - Server state & data fetching
- **TanStack Table** - Advanced data tables
- **React Router** - Routing
- **Leaflet + React Leaflet** - Maps
- **Vite** - Build tool
- **Axios** - HTTP client

## 📁 Project Structure

```
src/
├── components/      # React components
├── pages/          # Page routes
├── hooks/          # Custom hooks (React Query)
├── utils/          # API & helpers
├── styles/         # CSS
├── App.jsx
└── main.jsx
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development server (localhost:5173)
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

## 🔌 API Integration

- Development: Proxies `/api` → `http://localhost:5000`
- Production: Uses relative `/api` paths
- Configure via `.env` files

## 📊 Key Features

### Hooks (Data Fetching)
- `useDevices()` - Device list with auto-refresh
- `useSensorData()` - Sensor readings
- `useAlerts()` - Alert management
- `useStatistics()` - System stats

### Pages
- `/` - Interactive map with devices
- `/dashboard` - Data tables & charts

### Components
- `MapComponent` - Leaflet map
- `SensorTable` - TanStack Table with sorting/pagination
- `AlertPanel` - Active alerts
- `Statistics` - Stats cards

## 📚 Documentation

See [detailed README](./README_FULL.md) for complete setup & migration guide.

## 🛠️ Development

- **HMR**: Hot Module Replacement enabled
- **Devtools**: TanStack Query Devtools available
- **Responsive**: Mobile-first design
- **Performance**: Code splitting via Vite

## ✅ Status

✨ Ready for development! Connect with Flask backend on port 5000.

