#!/bin/bash

ASSETS_DIR="public/assets/mediterranean"
QUALITY=75

# Find all png, jpg, jpeg files and convert them to webp
find "$ASSETS_DIR" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) | while read -r img; do
    webp_img="${img%.*}.webp"
    echo "Converting $img to $webp_img..."
    cwebp -q $QUALITY "$img" -o "$webp_img"
    
    # Optional: remove original if you want, but safer to keep for now or check first
    # rm "$img"
done
