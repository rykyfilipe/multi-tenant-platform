#!/bin/bash

# Setup script for ANAF e-Factura development with ngrok
# This script helps configure ngrok for ANAF OAuth development

echo "🚀 Setting up ngrok for ANAF e-Factura development..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install ngrok first:"
    echo "   - Download from: https://ngrok.com/download"
    echo "   - Or install via package manager:"
    echo "     brew install ngrok/ngrok/ngrok  # macOS"
    echo "     snap install ngrok              # Ubuntu"
    echo "     choco install ngrok             # Windows"
    exit 1
fi

# Check if ngrok is authenticated
if ! ngrok config check &> /dev/null; then
    echo "🔑 Authenticating ngrok with provided authtoken..."
    ngrok config add-authtoken 32dbeORUHnyp8CBqsUaxzFDA0zc_4kWNUnd7eSkG1sPrYKCs8
    if [ $? -eq 0 ]; then
        echo "✅ ngrok authenticated successfully!"
    else
        echo "❌ Failed to authenticate ngrok. Please check your authtoken."
        exit 1
    fi
fi

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel on port 3000..."
echo "   This will expose your localhost:3000 as a public HTTPS URL"
echo "   Required by ANAF for OAuth redirects (localhost not allowed)"
echo ""

# Start ngrok in background
ngrok http 3000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# Wait a moment for ngrok to start
sleep 3

# Get the public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)

if [ -z "$NGROK_URL" ] || [ "$NGROK_URL" = "null" ]; then
    echo "❌ Failed to get ngrok URL. Please check ngrok status."
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ ngrok tunnel started successfully!"
echo "   Public URL: $NGROK_URL"
echo "   Process ID: $NGROK_PID"
echo ""

# Update .env file with ngrok URL
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
    echo "📝 Updating .env file with ngrok URL..."
    
    # Update ANAF_REDIRECT_URI
    if grep -q "ANAF_REDIRECT_URI" "$ENV_FILE"; then
        sed -i.bak "s|ANAF_REDIRECT_URI=.*|ANAF_REDIRECT_URI=\"$NGROK_URL/api/anaf/oauth/callback\"|" "$ENV_FILE"
    else
        echo "ANAF_REDIRECT_URI=\"$NGROK_URL/api/anaf/oauth/callback\"" >> "$ENV_FILE"
    fi
    
    # Update NEXTAUTH_URL
    if grep -q "NEXTAUTH_URL" "$ENV_FILE"; then
        sed -i.bak "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"$NGROK_URL\"|" "$ENV_FILE"
    else
        echo "NEXTAUTH_URL=\"$NGROK_URL\"" >> "$ENV_FILE"
    fi
    
    echo "✅ .env file updated with ngrok URL"
else
    echo "⚠️  .env file not found. Please create it and add:"
    echo "   ANAF_REDIRECT_URI=\"$NGROK_URL/api/anaf/oauth/callback\""
    echo "   NEXTAUTH_URL=\"$NGROK_URL\""
fi

echo ""
echo "🔧 Next steps:"
echo "   1. Update your ANAF OAuth app settings with this redirect URI:"
echo "      $NGROK_URL/api/anaf/oauth/callback"
echo "   2. Start your Next.js development server:"
echo "      npm run dev"
echo "   3. Test ANAF integration at: $NGROK_URL"
echo ""
echo "📋 To stop ngrok: kill $NGROK_PID"
echo "📋 To view ngrok dashboard: http://localhost:4040"
echo "📋 Logs are saved in: ngrok.log"

# Save PID for easy cleanup
echo $NGROK_PID > ngrok.pid
echo "💾 ngrok PID saved to ngrok.pid"
