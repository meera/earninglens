#!/usr/bin/env node
/**
 * Remotion video rendering script for sushi
 * Renders earnings video from transcripts and insights
 */

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

// Parse arguments
const videoId = process.argv[2];

if (!videoId) {
	console.error('Usage: node render-video.js <video-id>');
	process.exit(1);
}

// Directories
const sushiDir = path.join(__dirname, '..');
const videoDir = path.join(sushiDir, 'videos', videoId);
const studioDir = path.join(sushiDir, '..', 'studio');

// Check if video directory exists
if (!fs.existsSync(videoDir)) {
	console.error(`❌ Video directory not found: ${videoDir}`);
	process.exit(1);
}

// Load data
console.log('📂 Loading video data...');

const transcriptPath = path.join(videoDir, 'transcripts', 'transcript.json');
const insightsPath = path.join(videoDir, 'transcripts', 'insights.json');
const metadataPath = path.join(videoDir, 'metadata.json');
const audioPath = path.join(videoDir, 'input', 'source.mp4');

if (!fs.existsSync(transcriptPath)) {
	console.error(`❌ Transcript not found: ${transcriptPath}`);
	process.exit(1);
}

if (!fs.existsSync(insightsPath)) {
	console.error(`❌ Insights not found: ${insightsPath}`);
	process.exit(1);
}

const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf-8'));
const insights = JSON.parse(fs.readFileSync(insightsPath, 'utf-8'));
const metadata = fs.existsSync(metadataPath)
	? JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
	: {};

// Extract company info from insights
const company = insights.metadata?.title || 'Company';
const ticker = videoId.split('-')[0].toUpperCase();
const quarter = videoId.includes('q1')
	? 'Q1'
	: videoId.includes('q2')
		? 'Q2'
		: videoId.includes('q3')
			? 'Q3'
			: videoId.includes('q4')
				? 'Q4'
				: 'Q?';
const year = videoId.match(/\d{4}/)?.[0] || new Date().getFullYear();

// Prepare input props for Remotion
const inputProps = {
	videoId,
	company,
	ticker,
	quarter,
	year: parseInt(year),
	audioUrl: audioPath,
	transcript: transcript.segments || [],
	insights: insights.insights || {},
	speakers: insights.speaker_names || {},
	tableOfContents: insights.table_of_contents || [],
	metadata: insights.metadata || {},
};

// Save input props to temp file
const propsPath = path.join(videoDir, 'transcripts', 'remotion-props.json');
fs.writeFileSync(propsPath, JSON.stringify(inputProps, null, 2));

console.log('✓ Video data loaded');
console.log(`  Company: ${company}`);
console.log(`  Ticker: ${ticker}`);
console.log(`  Period: ${quarter} ${year}`);
console.log(`  Speakers: ${Object.keys(inputProps.speakers).length}`);

// Render video with Remotion
console.log('\n🎬 Rendering video with Remotion...');
console.log('  This may take 10-30 minutes...\n');

const outputPath = path.join(videoDir, 'output', 'final.mp4');

try {
	// Change to studio directory
	process.chdir(studioDir);

	// Run Remotion render
	const renderCommand = `npx remotion render \
		src/remotion/index.ts \
		EarningsVideo \
		"${outputPath}" \
		--props='${JSON.stringify(inputProps).replace(/'/g, "\\'")}' \
		--codec=h264 \
		--crf=18 \
		--concurrency=50% \
		--log=verbose`;

	console.log(`Running: ${renderCommand}\n`);

	execSync(renderCommand, {
		stdio: 'inherit',
		env: {...process.env},
	});

	console.log('\n✓ Video rendered successfully!');
	console.log(`  Output: ${outputPath}`);

	// Get file size
	const stats = fs.statSync(outputPath);
	const fileSizeMB = (stats.size / 1024 / 1024).toFixed(1);
	console.log(`  Size: ${fileSizeMB} MB`);

	// Update metadata
	if (fs.existsSync(metadataPath)) {
		const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
		metadata.status = metadata.status || {};
		metadata.status.render = 'completed';
		metadata.output = {
			file_path: outputPath,
			size_mb: parseFloat(fileSizeMB),
			rendered_at: new Date().toISOString(),
		};
		fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
		console.log('✓ Metadata updated');
	}
} catch (error) {
	console.error('\n❌ Rendering failed:', error.message);
	process.exit(1);
}
