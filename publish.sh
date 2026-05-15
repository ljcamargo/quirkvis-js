#!/bin/bash

# Exit on error
set -e

echo "Starting deployment of QuirkVis packages..."

# 1. Build everything
echo "Building packages..."
bun run build

# 2. Login to NPM
echo "Logging into NPM..."
npm login

# 3. Publish packages
PACKAGES=("packages/core" "packages/react" "packages/cli")

for PKG in "${PACKAGES[@]}"; do
    echo "Publishing $PKG..."
    cd $PKG
    # Use --access public since they are scoped packages (@quirkvis)
    npm publish --access public || echo "Skipped $PKG (might be already published with this version)"
    cd - > /dev/null
done

echo "Deployment complete!"
