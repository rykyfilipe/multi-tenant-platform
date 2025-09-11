#!/bin/bash

# Script to install Chrome for Puppeteer PDF generation
echo "Installing Chrome for Puppeteer PDF generation..."

# Check if we're in a Linux environment
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Detected Linux environment"
    
    # Update package list
    sudo apt-get update
    
    # Install dependencies
    sudo apt-get install -y wget gnupg
    
    # Add Google Chrome repository
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
    
    # Update package list again
    sudo apt-get update
    
    # Install Google Chrome
    sudo apt-get install -y google-chrome-stable
    
    echo "Google Chrome installed successfully"
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected macOS environment"
    echo "Please install Chrome manually from https://www.google.com/chrome/"
    
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo "Detected Windows environment"
    echo "Please install Chrome manually from https://www.google.com/chrome/"
    
else
    echo "Unknown operating system: $OSTYPE"
    echo "Please install Chrome manually from https://www.google.com/chrome/"
fi

# Install Chrome via Puppeteer as fallback
echo "Installing Chrome via Puppeteer as fallback..."
npx puppeteer browsers install chrome

echo "Chrome installation completed!"
