# TaskTracker API

A production-ready Node.js REST API for task management built with Express, TypeScript, PostgreSQL, and Prisma.

## Features

- User authentication (register/login) with JWT
- CRUD operations for tasks
- Task filtering by status, priority, and search
- Pagination and sorting
- User-scoped tasks (users can only access their own tasks)
- Rate limiting
- Input validation with Zod
- Comprehensive error handling

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, CORS, bcrypt, express-rate-limit

## Project Structure

```
tasktracker/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── auth.controller.ts
│   │   └── task.controller.ts
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts         # JWT authentication
│   │   ├── errorHandler.ts # Error handling
│   │   ├── rateLimit.ts    # Rate limiting
│   │   └── validate.ts     # Request validation
│   ├── models/
│   │   └── prisma.ts       # Prisma client
│   ├── routes/             # API routes
│   │   ├── auth.routes.ts
│   │   └── task.routes.ts
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   ├── utils/              # Utility functions
│   │   ├── env.ts          # Environment config
│   │   ├── jwt.ts          # JWT helpers
│   │   ├── password.ts     # Password hashing
│   │   └── response.ts     # Response helpers
│   ├── app.ts              # Express app setup
│   └── index.ts            # Entry point
├── tests/                  # Test files
├── .env.example            # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js v18 or higher
- PostgreSQL 13 or higher
- npm or yarn

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd tasktracker
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/tasktracker"
JWT_SECRET=your-secret-key-at-least-32-characters
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 4. Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

All task endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

### Endpoints

#### Auth Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |

#### Task Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks` | Get all tasks (with filters) | Yes |
| POST | `/api/tasks` | Create a new task | Yes |
| GET | `/api/tasks/stats` | Get task statistics | Yes |
| GET | `/api/tasks/:id` | Get task by ID | Yes |
| PUT | `/api/tasks/:id` | Update task | Yes |
| DELETE | `/api/tasks/:id` | Delete task | Yes |

### Request/Response Examples

#### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

#### Create Task

```bash
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Complete project",
  "description": "Finish the REST API",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "dueDate": "2024-12-31T23:59:59.000Z"
}
```

Response:
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "uuid",
    "title": "Complete project",
    "description": "Finish the REST API",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "userId": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Tasks with Filters

```bash
GET /api/tasks?status=PENDING&priority=HIGH&page=1&limit=10&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Query Parameters for Tasks

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max 100) |
| status | string | - | Filter by status: PENDING, IN_PROGRESS, COMPLETED |
| priority | string | - | Filter by priority: LOW, MEDIUM, HIGH |
| search | string | - | Search in title and description |
| sortBy | string | createdAt | Sort field: createdAt, updatedAt, dueDate, priority |
| sortOrder | string | desc | Sort order: asc, desc |

### Error Responses

```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

## Security Features

- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT Authentication**: Secure token-based auth with expiration
- **Rate Limiting**: Configurable request limits per IP
- **Helmet**: Security headers (XSS, CSP, etc.)
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Prevention**: Prisma ORM parameterized queries

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | No | development | Environment mode |
| PORT | No | 3000 | Server port |
| DATABASE_URL | Yes | - | PostgreSQL connection string |
| JWT_SECRET | Yes | - | JWT signing secret (min 32 chars) |
| JWT_EXPIRES_IN | No | 7d | Token expiration time |
| CORS_ORIGIN | No | * | Allowed origins |
| RATE_LIMIT_WINDOW_MS | No | 900000 | Rate limit window (15 min) |
| RATE_LIMIT_MAX_REQUESTS | No | 100 | Max requests per window |
| BCRYPT_SALT_ROUNDS | No | 12 | Password hash rounds |

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## License

MIT
