asdfghjkl
A comprehensive, enterprise-grade multi-tenant platform that enables organizations to manage their data, create custom dashboards, generate invoices, and integrate with external systems like ANAF e-Factura for Romanian complian

## 🚀 Overview

**YDV - Your Data Your View** is a sophisticated multi-tenant SaaS platform designed for businesses that need to:

- **Organize and manage customer data** across multiple databases
- **Create dynamic dashboards** with customizable widgets
- **Generate professional invoices** with multi-currency support
- **Integrate with government systems** (ANAF e-Factura for Romania)
- **Scale efficiently** with enterprise-grade security and performance

### Key Benefits

- 🏢 **Multi-Tenant Architecture**: Isolated data and configurations per organization
- 📊 **Dynamic Dashboards**: Drag-and-drop widgets with real-time data visualization
- 💰 **Advanced Invoicing**: Multi-currency support with automatic calculations
- 🔒 **Enterprise Security**: Role-based access control and audit logging
- 🌍 **Internationalization**: Multi-language support (EN, RO, ES, FR, DE)
- ⚡ **Real-Time Updates**: WebSocket-based live data synchronization
- 🔌 **API-First Design**: Comprehensive REST APIs for all operations

## 🛠 Technology Stack

### Frontend
- **Next.js 15.3.5** - React framework with App Router
- **React 18.2.0** - UI library with hooks and context
- **TypeScript 5.9.2** - Type-safe development
- **Tailwind CSS 4.0.0** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **React Grid Layout** - Drag-and-drop dashboard system
- **Recharts** - Data visualization library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma 6.13.0** - Type-safe database ORM
- **PostgreSQL** - Primary database
- **NextAuth.js 4.24.11** - Authentication framework
- **Zustand 5.0.8** - State management
- **Zod 3.25.76** - Schema validation

### Infrastructure & DevOps
- **Vercel** - Hosting and deployment platform
- **PostgreSQL** - Database hosting
- **Stripe** - Payment processing
- **Jest** - Unit testing framework
- **Playwright** - End-to-end testing
- **ESLint** - Code linting and formatting

### Integrations
- **ANAF e-Factura** - Romanian government invoice system
- **Stripe** - Payment processing

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn package manager

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database
YDV_DATABASE_URL="postgresql://username:password@localhost:5432/multi_tenant_platform"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Stripe (optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# Cloudinary (optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"


# ANAF Integration (optional)
ANAF_CLIENT_ID="your-anaf-client-id"
ANAF_CLIENT_SECRET="your-anaf-client-secret"
ANAF_REDIRECT_URI="http://localhost:3000/api/anaf/callback"
ANAF_SANDBOX_URL="https://api.anaf.ro/test/ws"
ANAF_PRODUCTION_URL="https://api.anaf.ro/ws"

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/multi-tenant-platform.git
   cd multi-tenant-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed the database (optional)
   npm run db:seed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Register a new account or use seeded data

## 📁 Project Structure

```
multi-tenant-platform/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── api/               # API endpoints
│   │   │   ├── tenants/      # Tenant-specific APIs
│   │   │   ├── anaf/         # ANAF e-Factura integration
│   │   │   └── test/         # Testing endpoints
│   │   ├── home/             # Main application pages
│   │   ├── docs/             # Documentation pages
│   │   └── globals.css       # Global styles
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # Base UI components (Radix UI)
│   │   ├── invoice/          # Invoice-specific components
│   │   ├── anaf/             # ANAF integration components
│   │   └── dashboard/        # Dashboard components
│   ├── widgets/              # Dashboard widget system
│   │   ├── ui/               # Widget UI components
│   │   ├── schemas/          # Widget configuration schemas
│   │   ├── templates/        # Widget and layout templates
│   │   └── store/            # Widget state management
│   ├── lib/                  # Utility libraries and services
│   │   ├── anaf/             # ANAF integration services
│   │   ├── invoice-system.ts # Invoice management
│   │   ├── prisma.ts         # Database client
│   │   └── session.ts        # Authentication utilities
│   ├── hooks/                # Custom React hooks
│   ├── contexts/             # React contexts
│   ├── types/                # TypeScript type definitions
│   └── tours/                # User onboarding tours
├── prisma/                   # Database schema and migrations
├── tests/                    # Test files
│   ├── unit/                 # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                  # End-to-end tests
├── docs/                     # Documentation
│   └── features/             # Feature-specific documentation
├── public/                   # Static assets
└── scripts/                  # Utility scripts
```

## 🎯 Core Features

### 1. [Multi-Tenant Architecture](./docs/features/multi-tenant.md)
Complete tenant isolation with separate databases, user management, and configurations.

### 2. [Dynamic Dashboard System](./docs/features/dashboard-widgets.md)
Drag-and-drop dashboard builder with 8+ widget types and responsive layouts.

### 3. [Advanced Invoicing System](./docs/features/invoicing.md)
Multi-currency invoice generation with automatic calculations and PDF export.

### 4. [ANAF e-Factura Integration](./docs/features/anaf-integration.md)
Romanian government compliance with automatic invoice submission and validation.

### 5. [User Management & Permissions](./docs/features/user-management.md)
Role-based access control with custom roles and granular permissions.

### 6. [Database Schema Builder](./docs/features/schema-builder.md)
Visual database design with automatic table generation and relationships.


### 7. [API & Webhook System](./docs/features/api-webhooks.md)
Comprehensive REST APIs with webhook support for external integrations.

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# All tests with coverage
npm run test:all

# ANAF-specific tests
npm run test:anaf-e-factura
```

### Test Coverage

The project maintains comprehensive test coverage across:
- Unit tests for utilities and business logic
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- ANAF integration testing with sandbox environment

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Setup

1. **Database**: Set up PostgreSQL instance
2. **Environment Variables**: Configure all required environment variables
3. **Domain**: Update `NEXTAUTH_URL` and ANAF redirect URIs
4. **SSL**: Ensure HTTPS is enabled for production

### Vercel Deployment

The application is optimized for Vercel deployment:

```bash
# Deploy to Vercel
vercel --prod
```


### Documentation
- [Feature Documentation](./docs/features/)
- [API Reference](./docs/api/)
- [Deployment Guide](./docs/deployment/)

### Community Support
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Email**: support@ydv.digital

### Enterprise Support
For enterprise customers, we offer:
- Priority support
- Custom integrations
- On-premise deployment
- Training and consulting

Contact us at enterprise@ydv.digital for more information.

---

**Built with ❤️ by the YDV Team**

*Your Data Your View - Empowering businesses with intelligent data management*
