# Hotel Management SaaS — Frontend

Next.js 15 + TypeScript + Tailwind CSS admin dashboard.

## Requirements
- Node.js 18+
- npm or yarn

## Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# For production deployment, ensure NEXT_PUBLIC_API_URL is set to:
# https://hotel-sys.loop-pr.com/api

# 3. Start development server
npm run dev
```

Frontend runs at: **http://localhost:3000**

## Pages

| Route | Description | Auth Required |
|-------|-------------|--------------|
| `/login` | Login page | No |
| `/register` | Register page | No |
| `/dashboard` | Admin dashboard | Yes (redirects to /login) |

## Project Structure

```
app/
├── layout.tsx              # Root layout with AuthProvider
├── page.tsx                # Redirects to /login
├── login/
│   └── page.tsx            # Login page
├── register/
│   └── page.tsx            # Register page
└── dashboard/
    ├── layout.tsx          # Protected layout (sidebar + topbar)
    └── page.tsx            # Dashboard overview

components/
├── layout/
│   ├── Sidebar.tsx         # Collapsible sidebar with nav + logout
│   └── Topbar.tsx          # Top navigation bar
└── dashboard/
    ├── KPICard.tsx         # KPI metric card
    ├── ActivityFeed.tsx    # Recent activity timeline
    └── OccupancyChart.tsx  # Bar chart for occupancy trend

contexts/
└── AuthContext.tsx         # Global auth state + token management

lib/
└── api.ts                  # HTTP client for Laravel API

types/
└── index.ts                # TypeScript interfaces
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Laravel backend API URL | `https://hotel-sys.loop-pr.com/api` |

## Authentication Flow

1. User submits login form → POST `/api/auth/login`
2. Backend returns Sanctum token
3. Token stored in `localStorage` as `auth_token`
4. All API calls include `Authorization: Bearer {token}`
5. On app load, token is verified via GET `/api/auth/me`
6. Protected routes redirect to `/login` if not authenticated
7. Logout revokes token via POST `/api/auth/logout` + clears localStorage
