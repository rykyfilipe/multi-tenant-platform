#!/bin/bash

# Stop ngrok script for ANAF development

echo "🛑 Stopping ngrok tunnel..."

# Check if PID file exists
if [ -f "ngrok.pid" ]; then
    NGROK_PID=$(cat ngrok.pid)
    echo "   Found ngrok process: $NGROK_PID"
    
    # Kill the process
    if kill $NGROK_PID 2>/dev/null; then
        echo "✅ ngrok tunnel stopped successfully"
        rm ngrok.pid
    else
        echo "⚠️  Could not stop ngrok process (may already be stopped)"
        rm ngrok.pid
    fi
else
    echo "⚠️  No ngrok PID file found. Trying to find and kill ngrok processes..."
    
    # Find and kill ngrok processes
    PIDS=$(pgrep -f "ngrok http 3000")
    if [ -n "$PIDS" ]; then
        echo "   Found ngrok processes: $PIDS"
        kill $PIDS
        echo "✅ ngrok processes stopped"
    else
        echo "ℹ️  No ngrok processes found"
    fi
fi

# Clean up log file
if [ -f "ngrok.log" ]; then
    echo "📝 ngrok log file preserved: ngrok.log"
fi

echo "🏁 Done!"
