# Project Structure

## Root Level Organization
```
mawami/
├── frontend/           # Next.js application
├── backend/            # NestJS API server
├── package.json        # Workspace configuration
└── .kiro/             # Kiro steering rules
```

## Frontend Structure (`frontend/`)
```
src/
├── app/                # Next.js App Router
│   ├── (client)/      # Public client routes
│   │   ├── (protected)/  # Auth-required routes
│   │   └── auth/      # Authentication pages
│   └── admin/         # Admin panel routes
├── components/        # Reusable UI components
│   ├── auth/         # Authentication components
│   ├── biodata/      # Biodata-specific components
│   ├── common/       # Shared components
│   ├── layout/       # Layout components
│   └── ui/           # Base UI components
├── context/          # React Context providers
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
│   ├── api-client.ts # Centralized API client
│   ├── api-services.ts # API service functions
│   └── validation.ts # Zod schemas
└── types/            # TypeScript type definitions
```

## Backend Structure (`backend/src/`)
```
src/
├── auth/             # Authentication module
│   ├── decorators/   # Custom decorators
│   ├── dto/          # Data Transfer Objects
│   ├── guards/       # Auth guards
│   └── strategies/   # Passport strategies
├── biodata/          # Biodata management
│   ├── dto/          # Request/response DTOs
│   ├── entities/     # Database entities
│   └── enums/        # Status enums
├── user/             # User management
├── favorites/        # Favorites system
├── upload/           # File upload handling
├── common/           # Shared utilities
│   └── filters/      # Exception filters
├── migrations/       # Database migrations
└── seeds/            # Database seed data
```

## Key Conventions

### Naming Patterns
- **Files**: kebab-case (`user-profile.component.ts`)
- **Components**: PascalCase (`UserProfile`)
- **Services**: PascalCase with suffix (`BiodataService`)
- **DTOs**: PascalCase with suffix (`CreateBiodataDto`)
- **Entities**: PascalCase (`Biodata`, `User`)

### Route Organization
- **Frontend**: App Router with route groups `(client)`, `(protected)`
- **Backend**: Module-based with `/api` prefix
- **Admin Routes**: Separate `/admin` namespace
- **Auth Routes**: Grouped under `/auth`

### Component Structure
- **Layout Components**: Header, Footer, Sidebar in `components/layout/`
- **Feature Components**: Grouped by domain (`biodata/`, `auth/`)
- **UI Components**: Base components in `components/ui/`
- **Form Components**: React Hook Form with Zod validation

### API Patterns
- **REST Endpoints**: Standard CRUD operations
- **Authentication**: JWT Bearer tokens
- **Error Handling**: Centralized with custom ApiError class
- **File Uploads**: Multer with S3 integration
- **Validation**: Class-validator decorators on DTOs

### Database Patterns
- **Entities**: TypeORM decorators with relationships
- **Migrations**: Manual migrations in `src/migrations/`
- **Enums**: Separate enum files for status types
- **Seeding**: Automated seed data for development

### State Management
- **Server State**: TanStack React Query
- **Client State**: React Context for auth and UI state
- **Form State**: React Hook Form with Zod schemas
- **Local Storage**: Token management and user preferences