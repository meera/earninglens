#!/usr/bin/env node
/**
 * YouTube upload script
 * Uploads rendered video to YouTube with optimized metadata
 */

const fs = require('fs');
const path = require('path');
const {google} = require('googleapis');
require('dotenv').config({path: path.join(__dirname, '..', 'config', '.env')});

// Parse arguments
const videoId = process.argv[2];

if (!videoId) {
	console.error('Usage: node upload-youtube.js <video-id>');
	process.exit(1);
}

// Directories
const sushiDir = path.join(__dirname, '..');
const videoDir = path.join(sushiDir, 'videos', videoId);

// Load data
const insightsPath = path.join(videoDir, 'transcripts', 'insights.json');
const metadataPath = path.join(videoDir, 'metadata.json');
const videoPath = path.join(videoDir, 'output', 'final.mp4');
const thumbnailPath = path.join(videoDir, 'thumbnail', 'custom.jpg');

if (!fs.existsSync(videoPath)) {
	console.error(`❌ Video file not found: ${videoPath}`);
	process.exit(1);
}

if (!fs.existsSync(insightsPath)) {
	console.error(`❌ Insights file not found: ${insightsPath}`);
	process.exit(1);
}

const insights = JSON.parse(fs.readFileSync(insightsPath, 'utf-8'));
const metadata = fs.existsSync(metadataPath)
	? JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
	: {};

// Extract info
const ticker = videoId.split('-')[0].toUpperCase();
const quarter = videoId.includes('q1')
	? 'Q1'
	: videoId.includes('q2')
		? 'Q2'
		: videoId.includes('q3')
			? 'Q3'
			: videoId.includes('q4')
				? 'Q4'
				: '';
const year = videoId.match(/\d{4}/)?.[0] || new Date().getFullYear();
const company = insights.metadata?.title || ticker;

// Generate SEO-optimized metadata
const title = `${company} (${ticker}) ${quarter} ${year} Earnings Call - Visual Summary | EarningLens`;

const keyTakeaways = insights.insights?.key_takeaways || [];
const takeawaysList = keyTakeaways
	.slice(0, 3)
	.map((t) => `- ${t}`)
	.join('\n');

const description = `
${company} (${ticker}) ${quarter} ${year} earnings call with visual charts, transcripts, and financial analysis.

📊 Key Highlights:
${takeawaysList}

🔗 Full interactive analysis: https://earninglens.com/${ticker.toLowerCase()}/${quarter.toLowerCase()}-${year}

Timestamps:
${(insights.table_of_contents || [])
	.map((toc) => `${toc.timestamp} ${toc.title}`)
	.join('\n')}

Subscribe for more earnings call visualizations!

#${ticker} #earnings #investing #stocks #finance
`.trim();

const tags = [
	ticker,
	company,
	'earnings call',
	'earnings',
	'investing',
	'stocks',
	'finance',
	quarter,
	year.toString(),
	'earnings analysis',
	'stock market',
	'quarterly earnings',
];

console.log('📤 Uploading to YouTube...');
console.log(`  Title: ${title}`);
console.log(`  Tags: ${tags.join(', ')}`);

// YouTube API setup
const oauth2Client = new google.auth.OAuth2(
	process.env.YOUTUBE_CLIENT_ID,
	process.env.YOUTUBE_CLIENT_SECRET,
	process.env.YOUTUBE_REDIRECT_URI,
);

oauth2Client.setCredentials({
	refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
});

const youtube = google.youtube({
	version: 'v3',
	auth: oauth2Client,
});

// Upload video
async function uploadVideo() {
	try {
		console.log('\n  Uploading video file...');

		const res = await youtube.videos.insert({
			part: ['snippet', 'status'],
			requestBody: {
				snippet: {
					title,
					description,
					tags,
					categoryId: '28', // Science & Technology
				},
				status: {
					privacyStatus: 'public', // or 'unlisted', 'private'
					selfDeclaredMadeForKids: false,
				},
			},
			media: {
				body: fs.createReadStream(videoPath),
			},
		});

		const youtubeId = res.data.id;
		const youtubeUrl = `https://youtube.com/watch?v=${youtubeId}`;

		console.log('\n✓ Video uploaded successfully!');
		console.log(`  YouTube ID: ${youtubeId}`);
		console.log(`  URL: ${youtubeUrl}`);

		// Upload custom thumbnail if exists
		if (fs.existsSync(thumbnailPath)) {
			console.log('\n  Uploading custom thumbnail...');
			await youtube.thumbnails.set({
				videoId: youtubeId,
				media: {
					body: fs.createReadStream(thumbnailPath),
				},
			});
			console.log('✓ Thumbnail uploaded');
		} else {
			console.log(
				'\n⚠ No custom thumbnail found. YouTube will auto-generate one.',
			);
			console.log(`  Design thumbnail and save to: ${thumbnailPath}`);
			console.log(
				`  Then run: node sushi/scripts/update-thumbnail.js ${videoId}`,
			);
		}

		// Update metadata
		if (fs.existsSync(metadataPath)) {
			const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
			metadata.status = metadata.status || {};
			metadata.status.upload = 'completed';
			metadata.youtube = {
				video_id: youtubeId,
				url: youtubeUrl,
				uploaded_at: new Date().toISOString(),
			};
			fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
			console.log('✓ Metadata updated');
		}

		return youtubeId;
	} catch (error) {
		console.error('\n❌ Upload failed:', error.message);
		if (error.response) {
			console.error('Response:', error.response.data);
		}
		process.exit(1);
	}
}

// Run upload
uploadVideo();
