---
project_name: 'bmad-starter-kit'
user_name: 'BMAD Learning'
date: '2025-01-16'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns', 'patterns']
status: 'complete'
rule_count: 30
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Frontend (Monorepo apps/web)

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.1.3 | Type Safety (宽松模式) |
| Vite | 5.4.19 | Build Tool & Dev Server |
| React Router DOM | 6.30.1 | Client-Side Routing |
| @tanstack/react-query | 5.83.0 | Server State Management |
| React Hook Form | 7.61.1 | Form Management |
| Zod | 3.25.76 | Schema Validation |
| Tailwind CSS | 3.4.17 | Styling |
| shadcn/ui (Radix UI) | - | Component Library |
| lucide-react | 0.462.0 | Icons |
| next-themes | 0.3.0 | Dark Mode |
| clsx / tailwind-merge | - | Classname utilities |

### Backend (Monorepo apps/api)

| Package | Purpose |
|---------|---------|
| NestJS | Backend Framework |
| Prisma | ORM |
| @nestjs/jwt | JWT Authentication |
| bcrypt | Password Hashing |
| class-validator | DTO Validation |
| PostgreSQL | Database (Supabase or local) |

---

## Critical Implementation Rules

### 1. TypeScript Configuration (IMPORTANT)

**This project uses RELAXED TypeScript settings - do NOT enable strict mode:**

```json
{
  "noImplicitAny": false,        // ✅ 允许隐式 any
  "noUnusedParameters": false,   // ✅ 允许未使用参数
  "noUnusedLocals": false,       // ✅ 允许未使用局部变量
  "strictNullChecks": false      // ✅ 禁用严格空检查
}
```

**Do NOT add `strict: true` or enable strict options.**

### 2. Import Path Convention

**Always use the `@/` alias for src imports:**

```typescript
// ✅ CORRECT
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

// ❌ WRONG
import { Button } from "../../components/ui/button";
import { useAuth } from "../hooks/useAuth";
```

**For shared types from packages/shared:**

```typescript
// ✅ CORRECT
import type { User, LoginDto } from "@bmad-starter-kit/shared";
```

### 3. UI Component Usage

**Use shadcn/ui components from `@/components/ui/`:**

```typescript
// ✅ CORRECT
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
```

**Available base UI components:** accordion, alert, alert-dialog, avatar, badge, breadcrumb, button, calendar, card, checkbox, collapsible, command, context-menu, dialog, dropdown-menu, form, hover-card, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, tooltip

### 4. Component Naming Patterns

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `LoginForm.tsx`, `DashboardLayout.tsx` |
| Utils/Helpers | kebab-case | `api.ts`, `auth-utils.ts` |
| Hooks | camelCase with `use` prefix | `useAuth.ts`, `useAdminStats.ts` |
| Types/Interfaces | PascalCase | `User`, `LoginDto`, `ApiResponse` |
| Files | kebab-case or PascalCase | Both acceptable, prefer kebab-case |

### 5. Styling Convention

**Use Tailwind CSS classes - avoid inline styles:**

```typescript
// ✅ CORRECT
<div className="flex h-screen bg-background p-6">
  <Button className="w-full">Submit</Button>
</div>

// ❌ WRONG
<div style={{ display: 'flex', height: '100vh', background: 'var(--background)' }}>
  <Button style={{ width: '100%' }}>Submit</Button>
</div>
```

**Use cn() utility for conditional classes:**

```typescript
import { cn } from "@/lib/utils";

className={cn(
  "base-class",
  condition && "conditional-class",
  className
)}
```

### 6. State Management Pattern

| State Type | Solution | Location |
|------------|----------|----------|
| Local Component State | `useState` | Component file |
| Server State | React Query (`@tanstack/react-query`) | `hooks/use*.ts` |
| Form State | React Hook Form | Component file |
| URL State | React Router params | Component file |
| Theme State | next-themes Context | `providers.tsx` |
| Auth State | Zustand | `stores/auth.store.ts` |

### 7. Dark Mode Support

**Theme uses class-based strategy - use CSS variables:**

```css
/* ✅ Use semantic color tokens */
background: hsl(var(--background));
foreground: hsl(var(--foreground));
border: hsl(var(--border));
primary: hsl(var(--primary));
```

### 8. Form Validation Pattern

**Use React Hook Form + Zod:**

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(50),
});

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { email: "", password: "", name: "" },
});
```

---

## Code Organization Patterns

### Directory Structure

```
src/
├── components/
│   ├── ui/                  # shadcn/ui base components (DO NOT modify lightly)
│   ├── auth/                # Authentication feature components
│   ├── admin/               # Admin dashboard components
│   ├── layout/              # Layout components (Sidebar, Header, etc.)
│   └── routes/              # Route components (ProtectedRoute, etc.)
├── pages/                   # Page components (route handlers)
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── admin/
│   │   ├── Dashboard.tsx
│   │   └── Users.tsx
│   └── NotFound.tsx
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions
├── stores/                  # State management stores
├── providers.tsx            # App providers (Query, Theme, etc.)
└── main.tsx                 # Application entry point
```

### Monorepo Structure

```
bmad-starter-kit/
├── apps/
│   ├── web/                 # Frontend (React + Vite)
│   │   └── src/
│   └── api/                 # Backend (NestJS + Prisma)
│       └── src/
│           └── modules/     # NestJS modules (auth, users, admin)
└── packages/
    └── shared/              # Shared types and utilities
        └── src/
            ├── types/       # Shared TypeScript types
            └── constants.ts # Shared constants
```

---

## Testing Guidelines

### Testing Strategy

| Test Type | Framework | Location |
|-----------|-----------|----------|
| Unit Tests | Jest | `*.spec.ts` next to source |
| E2E Tests | Jest Supertest | `apps/api/test/e2e/` |
| Component Tests | Vitest React Testing Library | `*.test.tsx` |

### Testing Rules

1. **Test files should be co-located with source files**
2. **Use `describe`, `it`, `expect` patterns**
3. **Mock external dependencies (API calls, database)**
4. **Test user interactions, not implementation details**

---

## Backend Architecture Rules

### NestJS Module Structure

```
apps/api/src/modules/
├── auth/                    # Authentication
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/
│   ├── strategies/
│   └── dto/
├── users/                   # User management
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
├── admin/                   # Admin dashboard
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   └── dto/
├── prisma/                  # Prisma service
└── common/                  # Shared utilities
    ├── decorators/
    ├── filters/
    └── interceptors/
```

### API Route Convention

```
/api/v1/{resource}           # Plural resource names
  GET    /                   # List
  POST   /                   # Create
  GET    /:id                # Get one
  PUT    /:id                # Update
  DELETE /:id                # Delete
```

### Database Naming (Prisma)

- **Models**: PascalCase (`User`)
- **Fields**: camelCase (`userId`, `createdAt`)
- **Foreign Keys**: `{relation}Id` pattern
- **Enums**: PascalCase (`Role`, `USER` | `ADMIN`)

---

## Anti-Patterns to Avoid

### ❌ Do NOT

1. **Enable strict TypeScript** - Project uses relaxed mode intentionally
2. **Use relative imports** - Always use `@/` alias
3. **Inline styles** - Use Tailwind classes
4. **Class components** - Use function components
5. **Direct state mutations** - Use setState/useState properly
6. **Ignoring Zod validation** - All form inputs should be validated
7. **Hardcoded theme values** - Use CSS variables
8. **Modifying shadcn/ui components directly** - Extend instead

### ✅ Do

1. **Use function components with hooks**
2. **Import from `@/components/ui/` for base components**
3. **Use Tailwind CSS for all styling**
4. **Validate forms with Zod + React Hook Form**
5. **Use React Query for server state**
6. **Follow the existing folder structure**
7. **Use cn() utility for conditional classes**
8. **Keep components small and focused**

---

## Development Workflow

### Scripts

```bash
pnpm dev              # Start both api (3000) and web (8080)
pnpm dev:api          # Start only backend
pnpm dev:web          # Start only frontend
pnpm build            # Build all apps
pnpm lint             # Run lint
```

### Before Implementing

1. **Read this project-context.md file first**
2. **Check if a component already exists in `@/components/ui/`**
3. **Follow existing patterns in similar components**
4. **Use the same styling conventions**

---

## Quick Reference

### Common Imports

```typescript
// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Utilities
import { cn } from "@/lib/utils";

// Hooks
import { useEffect, useState } from "react";

// Routing
import { Link, useNavigate, useParams } from "react-router-dom";

// Query
import { useQuery } from "@tanstack/react-query";

// Forms
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Icons
import { IconName } from "lucide-react";

// Shared Types
import type { User, LoginDto } from "@bmad-starter-kit/shared";
```

---

**Last Updated:** 2025-01-16
**Status:** Ready for AI agent integration ✅
