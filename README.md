# Multi-Tenant Platform

A comprehensive multi-tenant platform built with Next.js, featuring user management, database management, and multi-language support.

## Features

- **Multi-Tenant Architecture**: Isolated tenant environments with shared infrastructure
- **User Management**: Role-based access control and user administration
- **Database Management**: Dynamic table creation and management
- **Multi-Language Support**: Internationalization (i18n) with 5 languages
- **Subscription Plans**: Tiered pricing with resource limits
- **Invoice System**: Automated billing and invoice generation

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Internationalization**: Custom i18n system
- **Deployment**: Vercel-ready configuration

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npx prisma migrate dev`
5. Start development server: `npm run dev`

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Translation Status

### ✅ Completed Components
- Dashboard components (navigation, analytics, organization management)
- Authentication components (login, registration, password reset)
- Cookie banner and contact forms
- Plan limits and notifications
- Database management components
- Table management components
- API consumer interface
- Error handling components
- Loading states and tour management

### 🔄 In Progress
- Additional UI components and utilities
- Form validation messages
- Error messages and notifications

### 📋 Pending
- Remaining utility components
- Additional user interface elements

## Supported Languages

- **English (en)** - Default language
- **Romanian (ro)** - Complete translation
- **Spanish (es)** - Complete translation  
- **French (fr)** - Complete translation
- **German (de)** - Complete translation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add translations for all supported languages
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
