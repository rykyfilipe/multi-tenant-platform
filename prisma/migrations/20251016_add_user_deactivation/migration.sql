-- Add isActive field to User model for soft deletion
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Add index for faster queries on active users
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- Add deactivatedAt timestamp to track when user was deactivated
ALTER TABLE "User" ADD COLUMN "deactivatedAt" TIMESTAMP(3);

-- Add deactivatedBy to track who deactivated the user
ALTER TABLE "User" ADD COLUMN "deactivatedBy" INTEGER;

