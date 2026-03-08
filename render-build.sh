#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Starting Render Build..."

echo "1. Installing Node dependencies..."
npm install

echo "2. Building Next.js..."
npm run build

echo "3. Downloading yt-dlp static binary..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o yt-dlp
chmod a+rx yt-dlp

echo "4. Downloading ffmpeg static binary..."
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg-static.tar.xz
tar -xf ffmpeg-static.tar.xz
# Extract ffmpeg binary to root folder
mv ffmpeg-*-amd64-static/ffmpeg ./ffmpeg
chmod a+rx ./ffmpeg
# Cleanup
rm -rf ffmpeg-*-amd64-static ffmpeg-static.tar.xz

echo "Build complete! yt-dlp and ffmpeg are ready in the root directory."
