#!/bin/bash

# Migration script for ANAF e-Factura tables
# This script creates the necessary database tables for ANAF integration

echo "🗄️  Creating ANAF e-Factura database tables..."

# Check if Prisma is installed
if ! command -v npx prisma &> /dev/null; then
    echo "❌ Prisma CLI not found. Please install Prisma:"
    echo "   npm install -g prisma"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it from env.example"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env; then
    echo "❌ DATABASE_URL not found in .env file"
    exit 1
fi

echo "✅ Environment configuration found"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
if npx prisma generate; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

# Run database migration
echo "🚀 Running database migration..."
if npx prisma db push; then
    echo "✅ Database migration completed successfully"
else
    echo "❌ Database migration failed"
    exit 1
fi

# Verify tables were created
echo "🔍 Verifying ANAF tables..."

# Check if ANAFCredentials table exists
if npx prisma db execute --stdin <<< "SELECT 1 FROM \"ANAFCredentials\" LIMIT 1;" 2>/dev/null; then
    echo "✅ ANAFCredentials table created"
else
    echo "❌ ANAFCredentials table not found"
fi

# Check if ANAFSubmissionLog table exists
if npx prisma db execute --stdin <<< "SELECT 1 FROM \"ANAFSubmissionLog\" LIMIT 1;" 2>/dev/null; then
    echo "✅ ANAFSubmissionLog table created"
else
    echo "❌ ANAFSubmissionLog table not found"
fi

echo ""
echo "🎉 ANAF database setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure ANAF OAuth credentials in .env"
echo "   2. Set up ngrok for local development:"
echo "      ./scripts/setup-ngrok-anaf.sh"
echo "   3. Start the development server:"
echo "      npm run dev"
echo "   4. Test the integration:"
echo "      ./scripts/test-anaf-integration.sh"
echo ""
echo "🔧 To view database schema:"
echo "   npx prisma studio"
