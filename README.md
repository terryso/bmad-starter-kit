# bmad-starter-kit

A BMAD learning project demonstrating a full-stack authentication system with admin dashboard.

## Features

- User Registration & Login
- JWT Authentication (Access + Refresh Token)
- Role-based Access Control (USER/ADMIN)
- Admin Dashboard with User Statistics
- User List Management (Pagination, Search, Filter)

## Tech Stack

- **Frontend**: React + Vite + shadcn/ui
- **Backend**: NestJS + Prisma
- **Database**: PostgreSQL
- **Auth**: JWT with bcrypt

## Project Structure

```
bmad-starter-kit/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # React frontend
├── packages/
│   └── shared/       # Shared types
├── _bmad/           # BMAD configuration
├── .claude/         # Claude CLI configuration
└── .windsurf/       # Windsurf configuration
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL

### Installation

```bash
# Install dependencies
pnpm install

# Setup backend environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your database credentials

# Setup frontend environment variables (optional)
cp apps/web/.env.example apps/web/.env

# Run database migrations
cd apps/api
npx prisma generate
npx prisma db push
cd ../..
```

### Development

```bash
# Start both frontend and backend
pnpm dev

# Or start individually
pnpm dev:api   # Backend on http://localhost:3000
pnpm dev:web   # Frontend on http://localhost:8080
```

### Build

```bash
pnpm build
```

## Default Admin User

Create your first admin user via the registration page, then manually update the role in the database:

```sql
UPDATE "user" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## License

MIT
