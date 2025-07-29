#!/bin/bash

echo "Fixing hosts file to remove kstorybridge.com entries..."

# Create a backup of the current hosts file
sudo cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)

# Remove lines containing kstorybridge.com
sudo sed -i '' '/kstorybridge\.com/d' /etc/hosts

echo "Hosts file updated. Flushing DNS cache..."

# Flush DNS cache on macOS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

echo "Done! Testing DNS resolution..."

# Test DNS resolution
echo "Testing kstorybridge.com resolution:"
dig kstorybridge.com +short

echo "Testing dashboard.kstorybridge.com resolution:"
dig dashboard.kstorybridge.com +short

echo ""
echo "If you see IP addresses (not 127.0.0.1), the fix worked!"
echo "You should now be able to access https://kstorybridge.com"