# Cloudinary Setup Guide

This guide explains how to set up Cloudinary for image uploads in the multi-tenant platform.

## What is Cloudinary?

Cloudinary is a cloud-based service that provides solutions for image and video management. It's perfect for serverless environments where you can't write to the local filesystem.

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your Credentials

After signing up, you'll find your credentials in the Dashboard:

1. **Cloud Name**: Found in the Dashboard URL (e.g., `your-cloud-name`)
2. **API Key**: Listed in the Dashboard
3. **API Secret**: Listed in the Dashboard

### 3. Configure Environment Variables

Add these variables to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 4. Deploy to Production

When deploying to Vercel or other platforms:

1. Add the environment variables in your deployment platform's settings
2. Make sure to add them to all environments (development, staging, production)

## Features

The Cloudinary integration includes:

- **Automatic image optimization**: Images are automatically resized and optimized
- **Face detection**: Profile images are cropped to focus on faces
- **Secure URLs**: All images are served over HTTPS
- **Automatic cleanup**: Old profile images are automatically deleted when new ones are uploaded

## Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB bandwidth per month
- 25,000 transformations per month

This should be sufficient for most small to medium applications.

## Troubleshooting

### Error: "Cloudinary is not configured"

Make sure all three environment variables are set:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Error: "Upload failed"

Check your Cloudinary dashboard for:
- Account status (make sure it's active)
- Usage limits (free tier limits)
- API key permissions

### Images not loading

Ensure your Cloudinary account is active and you haven't exceeded the free tier limits. 