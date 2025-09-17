#!/bin/bash

echo "🚨 WARNING: This will delete ALL data from the database!"
echo "Press Ctrl+C to cancel, or wait 3 seconds to continue..."

sleep 3

echo "🗑️  Resetting database..."

# Reset the database (this will drop and recreate all tables)
npx prisma db push --force-reset

echo "🌱 Seeding database with initial data..."

# Run the seed script
npx prisma db seed

echo "✅ Database reset completed successfully!"
