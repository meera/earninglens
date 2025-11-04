# Videos to Process

Track earnings videos to process. Check off when completed.

## Upcoming Earnings (Add manually)

- [ ] pltr-q3-2024 - Palantir Q3 2024 - https://youtube.com/watch?v=jUnV3LiN0_k
- [ ]

## Processing Queue

Videos currently being processed.

(None)

## Completed

Videos that have been processed and uploaded.

- [ ]

---

## How to Add Videos

1. Find earnings call video (YouTube or company IR website)
2. Add to "Upcoming Earnings" section above
3. Format: `- [ ] <video-id> - <Company> <Quarter> <Year> - <URL or "manual upload">`
4. Commit and push to git
5. Pull on sushi and run: `./sushi/scripts/process-earnings.sh <video-id> <source> [url]`

## Video ID Format

Use format: `<ticker>-<quarter>-<year>`

Examples:
- `pltr-q3-2024` - Palantir Q3 2024
- `nvda-q4-2024` - NVIDIA Q4 2024
- `aapl-q1-2025` - Apple Q1 2025
- `msft-q2-2024` - Microsoft Q2 2024

## Sources

**YouTube:**
- Official company channels
- CNBC, Bloomberg, Yahoo Finance uploads

**Company IR Websites:**
- Check investor.company.com
- Look for "Earnings Calls" or "Webcasts"
- Download video manually if needed

## After Processing

1. Check the video rendered correctly
2. Design custom thumbnail on Mac
3. Save to: `sushi/videos/<video-id>/thumbnail/custom.jpg`
4. Push to git
5. Pull on sushi and run: `./sushi/scripts/update-thumbnail.sh <video-id>`
6. Move to "Completed" section
