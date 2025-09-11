#!/bin/bash

# Script to install Chrome in Docker container for Puppeteer PDF generation
echo "Installing Chrome in Docker container for Puppeteer PDF generation..."

# Install dependencies
apt-get update
apt-get install -y wget gnupg

# Add Google Chrome repository
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

# Update package list
apt-get update

# Install Google Chrome
apt-get install -y google-chrome-stable

# Install Chrome via Puppeteer as fallback
echo "Installing Chrome via Puppeteer as fallback..."
npx puppeteer browsers install chrome

echo "Chrome installation completed in Docker container!"
