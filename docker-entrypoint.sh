#!/bin/sh
set -e

# Fix permissions on /data directory if mounted as volume
# This ensures the node user can write to the database
if [ -d "/data" ]; then
    # Check if we can write to /data
    if ! touch /data/.write_test 2>/dev/null; then
        echo "Warning: /data is not writable by node user (uid=$(id -u))"
        echo "Attempting to fix permissions..."
        
        # If running as root (shouldn't happen, but just in case), fix it
        if [ "$(id -u)" = "0" ]; then
            chown -R node:node /data
            echo "Permissions fixed. Switching to node user..."
            exec su-exec node "$@"
        else
            echo "ERROR: Cannot write to /data directory!"
            echo "Please ensure the host directory has correct permissions:"
            echo "  chown -R 1000:1000 /mnt/user/appdata/luvumore"
            exit 1
        fi
    else
        rm -f /data/.write_test
    fi
fi

# Execute the main command
exec "$@"
