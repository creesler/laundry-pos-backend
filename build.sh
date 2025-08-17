#!/bin/bash

# Create public directory if it doesn't exist
mkdir -p public

# Copy all files from public directory
cp -r public/* public/

# Log the contents for debugging
echo "Contents of public directory:"
ls -la public/
echo "Contents of public/admin directory:"
ls -la public/admin/
