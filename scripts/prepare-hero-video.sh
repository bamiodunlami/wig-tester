#!/usr/bin/env bash
# Converts a turntable clip into a hero video that can be scrubbed smoothly with the mouse.
#
# Usage: scripts/prepare-hero-video.sh <input-video> [--reverse]
#
# The clip should go from the model's left profile (facing screen-left) to her right
# profile. Pass --reverse if it was filmed the other way round.
# Writes public/hero/turntable.mp4, turntable.webm and turntable-poster.jpg (middle frame).
set -euo pipefail

input="${1:?Usage: scripts/prepare-hero-video.sh <input-video> [--reverse]}"
filters="scale=768:-2:flags=lanczos,fps=30"
[[ "${2:-}" == "--reverse" ]] && filters="$filters,reverse"

out="public/hero/turntable.mp4"
# -g 1: every frame is a keyframe, so jumping to any point is instant.
ffmpeg -y -loglevel error -i "$input" -an -vf "$filters" \
  -c:v libx264 -preset slow -crf 26 -g 1 -bf 0 -pix_fmt yuv420p -movflags +faststart "$out"

# WebM fallback for browsers without H.264 (e.g. some Linux Chromium builds).
ffmpeg -y -loglevel error -i "$input" -an -vf "$filters" \
  -c:v libvpx-vp9 -crf 44 -b:v 0 -g 1 -row-mt 1 -pix_fmt yuv420p "${out%.mp4}.webm"

duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")
ffmpeg -y -loglevel error -ss "$(echo "$duration / 2" | bc -l)" -i "$out" -frames:v 1 -q:v 3 public/hero/turntable-poster.jpg

echo "Wrote $out ($(du -h "$out" | cut -f1), ${duration}s), ${out%.mp4}.webm ($(du -h "${out%.mp4}.webm" | cut -f1)) and the poster"
echo "Now set TURNTABLE_VIDEO in src/components/home/HeroModel.tsx:"
echo '  { src: "/hero/turntable", poster: "/hero/turntable-poster.jpg" }'
