# TaskTracker Frontend

A modern React frontend for the TaskTracker API, built with Vite, TailwindCSS, and React Router.

## Features

- User authentication (Login/Register)
- Task management (Create, Read, Update, Delete)
- Task filtering by status and priority
- Search functionality
- Responsive mobile design
- Color-coded task status badges
- Due date tracking with overdue indicators

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client

## Prerequisites

- Node.js 18+
- npm or yarn
- TaskTracker API running on `http://localhost:3000`

## Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file (optional - defaults work for local development):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
frontend/
├── public/
│   └── vite.svg           # Favicon
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Layout.jsx     # Main layout wrapper
│   │   ├── Navbar.jsx     # Navigation bar
│   │   └── TaskCard.jsx   # Task display card
│   ├── context/
│   │   └── AuthContext.jsx # Authentication state
│   ├── pages/
│   │   ├── Login.jsx      # Login page
│   │   ├── Register.jsx   # Registration page
│   │   ├── Tasks.jsx      # Task list page
│   │   └── TaskForm.jsx   # Create/Edit task page
│   ├── services/
│   │   └── api.js         # Axios API client
│   ├── App.jsx            # Routes configuration
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles & Tailwind
├── .env.example           # Environment template
├── index.html             # HTML entry point
├── package.json           # Dependencies
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.js     # Tailwind configuration
└── vite.config.js         # Vite configuration
```

## API Proxy

In development, Vite proxies all `/api` requests to the backend server. This is configured in `vite.config.js`:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

## Authentication

- JWT tokens are stored in `localStorage`
- Tokens are automatically attached to API requests via Axios interceptor
- Expired/invalid tokens redirect users to the login page
- Protected routes require authentication

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory. Serve it with any static file server.

For production, ensure `VITE_API_URL` points to your production API URL, or configure your web server to proxy `/api` requests to the backend.
