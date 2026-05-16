#!/bin/bash

# Exit on error
set -e

echo "Starting deployment of QuirkVis packages..."

# 1. Build everything
echo "Building packages..."
bun run build

# 2. Login to NPM
echo "Checking NPM login status..."
npm whoami || npm login

# 3. Publish packages
PACKAGES=("packages/core" "packages/react" "packages/cli")

for PKG in "${PACKAGES[@]}"; do
    echo "------------------------------------------------"
    echo "Publishing $PKG..."
    cd $PKG
    # If you have 2FA enabled, npm will prompt for the OTP code here.
    npm publish --access public
    cd - > /dev/null
done

echo "------------------------------------------------"
echo "Deployment complete!"
