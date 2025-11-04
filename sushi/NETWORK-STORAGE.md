# Network Storage Setup for Sushi Pipeline

This guide explains how to use network drives for video storage with the sushi pipeline.

## Overview

The sushi machine (192.168.1.101) has two network-accessible drives:
- **home-meera**: User home directory (~1.7TB)
- **var-data**: Data storage (size TBD)

Videos can be stored on these drives instead of in the git repo to save space and avoid large commits.

## Current Setup

**Detected mounts:**
- `//192.168.1.101/home-meera` → `/Volumes/home-meera` (Mac) or `/home/meera` (sushi)
- `//192.168.1.101/var-data` → `/Volumes/var-data` (Mac) or `/var/data` (sushi)

## Storage Options

### Option 1: In-Repo Storage (Default)
**Location:** `sushi/videos/`
**Pros:** Simple, git-tracked
**Cons:** Large repo size, slow git operations
**Best for:** Testing, first 5-10 videos

### Option 2: home-meera Network Drive
**Location:**
- Mac: `/Volumes/home-meera/earninglens-videos/`
- Sushi: `/home/meera/earninglens-videos/`

**Pros:** Network accessible, decent storage
**Cons:** Shared with home directory
**Best for:** Small to medium scale (10-50 videos)

### Option 3: var-data Network Drive (RECOMMENDED)
**Location:**
- Mac: `/Volumes/var-data/earninglens-videos/`
- Sushi: `/var/data/earninglens-videos/`

**Pros:** Dedicated data storage, large capacity
**Cons:** Requires network mount on Mac
**Best for:** Production scale (100+ videos)

## Setup Guide

### On Sushi (One-time setup)

```bash
# 1. SSH into sushi
ssh meera@192.168.1.101

# 2. Navigate to earninglens
cd ~/earninglens/sushi

# 3. Run storage setup
./setup-storage.sh

# Follow prompts to select storage location
# Recommended: Option 3 (/var/data/earninglens-videos)
```

### On Mac (Accessing network storage)

#### Mount home-meera (if not already mounted)

1. **Via Finder:**
   - Press `Cmd + K`
   - Enter: `smb://192.168.1.101/home-meera`
   - Login with sushi credentials
   - Mounted at: `/Volumes/home-meera`

2. **Via Terminal:**
   ```bash
   mount -t smbfs //Meera@192.168.1.101/home-meera /Volumes/home-meera
   ```

#### Mount var-data

1. **Via Finder:**
   - Press `Cmd + K`
   - Enter: `smb://192.168.1.101/var-data`
   - Login with sushi credentials
   - Mounted at: `/Volumes/var-data`

2. **Via Terminal:**
   ```bash
   mkdir -p /Volumes/var-data
   mount -t smbfs //Meera@192.168.1.101/var-data /Volumes/var-data
   ```

#### Auto-mount on Mac startup

Add to `/etc/fstab` or create a LaunchAgent:

```xml
<!-- ~/Library/LaunchAgents/com.sushi.mount.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.sushi.mount</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/osascript</string>
        <string>-e</string>
        <string>tell application "Finder" to mount volume "smb://192.168.1.101/var-data"</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

Then:
```bash
launchctl load ~/Library/LaunchAgents/com.sushi.mount.plist
```

## Configuration Files

### storage.conf

Located at: `sushi/config/storage.conf`

```bash
# Videos storage location
VIDEOS_BASE_DIR="/var/data/earninglens-videos"

# Logs location
LOGS_DIR="/home/meera/earninglens/sushi/logs"

# Temp directory
TEMP_DIR="/home/meera/earninglens/sushi/.tmp"
```

**Edit manually:**
```bash
nano sushi/config/storage.conf
```

**Or run setup wizard:**
```bash
./sushi/setup-storage.sh
```

## Usage

### Processing videos with network storage

No changes to workflow! Just run as normal:

```bash
# On sushi
./scripts/process-earnings.sh pltr-q3-2024 youtube <url>

# Videos are automatically saved to configured location
# Check with:
ls /var/data/earninglens-videos/pltr-q3-2024/
```

### Accessing processed videos

**On sushi:**
```bash
ls /var/data/earninglens-videos/
cd /var/data/earninglens-videos/pltr-q3-2024
```

**On Mac:**
```bash
# Make sure var-data is mounted
open /Volumes/var-data/earninglens-videos/

# Or via terminal
ls /Volumes/var-data/earninglens-videos/
cd /Volumes/var-data/earninglens-videos/pltr-q3-2024
```

### Designing thumbnails on Mac

```bash
# 1. Mount network drive (if not already)
open smb://192.168.1.101/var-data

# 2. Navigate to video folder
cd /Volumes/var-data/earninglens-videos/pltr-q3-2024

# 3. Design thumbnail (Figma, Canva, etc.)
# Save to: thumbnail/custom.jpg

# 4. No git commit needed! File is already on sushi

# 5. SSH to sushi and update YouTube
ssh meera@192.168.1.101
cd ~/earninglens/sushi
./scripts/update-thumbnail.sh pltr-q3-2024
```

## Git Workflow

### With network storage

Videos are NOT committed to git (too large). Only metadata is tracked:

```bash
# What gets committed:
sushi/config/storage.conf      # Storage configuration
sushi/logs/pltr-q3-2024.log   # Processing logs
sushi/videos-list.md           # Video queue

# What does NOT get committed:
sushi/videos/                  # Large video files (stored on network)
```

### Symlink for convenience

Setup creates a symlink:
```bash
sushi/videos -> /var/data/earninglens-videos
```

This allows:
```bash
# Works even though actual storage is elsewhere
ls sushi/videos/pltr-q3-2024/
cat sushi/videos/pltr-q3-2024/metadata.json
```

## Troubleshooting

### "Network drive not mounted"

**On Mac:**
```bash
# Check mounts
mount | grep 192.168.1.101

# Re-mount
open smb://192.168.1.101/var-data
```

**On sushi:**
```bash
# Check if directory exists
ls /var/data

# Check permissions
ls -ld /var/data/earninglens-videos
```

### "Permission denied"

```bash
# Check ownership
ls -ld /var/data/earninglens-videos

# Fix ownership (on sushi)
sudo chown -R meera:meera /var/data/earninglens-videos
sudo chmod -R 755 /var/data/earninglens-videos
```

### "Storage full"

```bash
# Check available space
df -h /var/data

# Clean up old videos if needed
du -sh /var/data/earninglens-videos/*
```

### "Symlink broken"

```bash
# Check symlink
ls -l sushi/videos

# Recreate symlink
rm sushi/videos
ln -s /var/data/earninglens-videos sushi/videos
```

## Storage Estimates

### Per video (46 min earnings call)

| File | Size |
|------|------|
| input/source.mp4 | ~75 MB |
| transcripts/*.json | ~500 KB |
| output/final.mp4 | ~100 MB |
| thumbnail/custom.jpg | ~200 KB |
| **Total** | **~175 MB** |

### Scale estimates

| Videos | Total Size | Recommended Storage |
|--------|------------|---------------------|
| 10 | ~1.75 GB | In-repo OK |
| 50 | ~8.75 GB | home-meera |
| 100 | ~17.5 GB | var-data |
| 500 | ~87.5 GB | var-data |
| 1000 | ~175 GB | var-data |

## Best Practices

1. **Use network storage for production**
   - Keeps git repo small
   - Faster git operations
   - Better backup strategy

2. **Keep logs in repo**
   - Logs are small (~50 KB)
   - Useful for debugging
   - Track processing history

3. **Backup strategy**
   - Network storage is primary
   - Git contains metadata
   - Consider S3/R2 for cold storage

4. **Clean up old videos**
   - Archive old quarters
   - Delete source files if needed
   - Keep final.mp4 and metadata.json

## Switching Storage Locations

To change storage location later:

```bash
# 1. Run setup wizard
./setup-storage.sh

# 2. Select new location

# 3. Move existing videos (optional)
mv /old/location/* /new/location/

# 4. Update symlink
rm sushi/videos
ln -s /new/location sushi/videos
```

## Summary

**Quick setup:**
```bash
# On sushi
./setup-storage.sh
# Choose option 3: /var/data/earninglens-videos

# On Mac (if accessing)
open smb://192.168.1.101/var-data

# Process as normal
./scripts/process-earnings.sh pltr-q3-2024 youtube <url>
```

**Benefits:**
- ✅ Network accessible from Mac and sushi
- ✅ Large storage capacity
- ✅ Git repo stays small
- ✅ Easy backup/restore
- ✅ No workflow changes

---

**Last Updated:** November 3, 2025
