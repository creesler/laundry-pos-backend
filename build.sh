#!/bin/bash
echo "Build script starting..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
npm install
echo "Dependencies installed"
echo "Build completed at $(date)"