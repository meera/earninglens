#!/usr/bin/env node
/**
 * Database integration script
 * Saves video record to web database
 */

const fs = require('fs');
const path = require('path');
const {Client} = require('pg');
require('dotenv').config({path: path.join(__dirname, '..', 'config', '.env')});

// Parse arguments
const videoId = process.argv[2];

if (!videoId) {
	console.error('Usage: node save-to-db.js <video-id>');
	process.exit(1);
}

// Directories
const sushiDir = path.join(__dirname, '..');
const videoDir = path.join(sushiDir, 'videos', videoId);

// Load data
const insightsPath = path.join(videoDir, 'transcripts', 'insights.json');
const transcriptPath = path.join(videoDir, 'transcripts', 'transcript.json');
const metadataPath = path.join(videoDir, 'metadata.json');

if (!fs.existsSync(metadataPath)) {
	console.error(`❌ Metadata file not found: ${metadataPath}`);
	process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
const insights = fs.existsSync(insightsPath)
	? JSON.parse(fs.readFileSync(insightsPath, 'utf-8'))
	: {};
const transcript = fs.existsSync(transcriptPath)
	? JSON.parse(fs.readFileSync(transcriptPath, 'utf-8'))
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
const year = parseInt(videoId.match(/\d{4}/)?.[0] || new Date().getFullYear());

console.log('💾 Saving to database...');
console.log(`  Video ID: ${videoId}`);
console.log(`  Ticker: ${ticker}`);
console.log(`  Period: ${quarter} ${year}`);

// Database connection
const client = new Client({
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false,
	},
});

async function saveToDatabase() {
	try {
		await client.connect();
		console.log('✓ Connected to database');

		// 1. Check/Create company
		console.log('\n  Checking company record...');
		let companyResult = await client.query(
			'SELECT id FROM companies WHERE ticker = $1',
			[ticker],
		);

		let companyId;
		if (companyResult.rows.length === 0) {
			// Create company
			const companyName = insights.metadata?.title || ticker;
			const insertCompany = await client.query(
				`INSERT INTO companies (ticker, name, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id`,
				[ticker, companyName],
			);
			companyId = insertCompany.rows[0].id;
			console.log(`  ✓ Created company: ${companyName} (${ticker})`);
		} else {
			companyId = companyResult.rows[0].id;
			console.log(`  ✓ Found company: ${ticker}`);
		}

		// 2. Create video record
		console.log('\n  Creating video record...');

		const title = insights.metadata?.title || `${ticker} ${quarter} ${year}`;
		const description = insights.metadata?.description || '';
		const summary = insights.metadata?.summary || '';
		const slug = `${quarter.toLowerCase()}-${year}`;
		const youtubeId = metadata.youtube?.video_id || null;
		const youtubeUrl = metadata.youtube?.url || null;
		const duration = metadata.source?.duration || 0;

		const videoResult = await client.query(
			`INSERT INTO videos (
        company_id,
        slug,
        title,
        description,
        summary,
        quarter,
        year,
        youtube_id,
        youtube_url,
        duration_seconds,
        status,
        published_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      ON CONFLICT (company_id, slug)
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        summary = EXCLUDED.summary,
        youtube_id = EXCLUDED.youtube_id,
        youtube_url = EXCLUDED.youtube_url,
        duration_seconds = EXCLUDED.duration_seconds,
        status = EXCLUDED.status
      RETURNING id`,
			[
				companyId,
				slug,
				title,
				description,
				summary,
				quarter,
				year,
				youtubeId,
				youtubeUrl,
				duration,
				'published',
			],
		);

		const dbVideoId = videoResult.rows[0].id;
		console.log(`  ✓ Video record created (ID: ${dbVideoId})`);

		// 3. Save earnings data (if available)
		if (insights.insights) {
			console.log('\n  Saving earnings data...');

			const financialData = {
				insights: insights.insights,
				table_of_contents: insights.table_of_contents || [],
				speakers: insights.speaker_names || {},
				entities: insights.entities || {},
			};

			await client.query(
				`INSERT INTO earnings_data (
          video_id,
          financial_data,
          created_at
        ) VALUES ($1, $2, NOW())
        ON CONFLICT (video_id)
        DO UPDATE SET
          financial_data = EXCLUDED.financial_data`,
				[dbVideoId, JSON.stringify(financialData)],
			);

			console.log('  ✓ Earnings data saved');
		}

		// 4. Update local metadata
		metadata.status = metadata.status || {};
		metadata.status.database = 'completed';
		metadata.database = {
			record_id: dbVideoId,
			company_id: companyId,
			created_at: new Date().toISOString(),
		};
		fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
		console.log('\n✓ Local metadata updated');

		console.log('\n✓ Database save complete!');
		console.log(`  Record ID: ${dbVideoId}`);
		console.log(`  Company ID: ${companyId}`);

		await client.end();
	} catch (error) {
		console.error('\n❌ Database save failed:', error.message);
		console.error(error.stack);
		await client.end();
		process.exit(1);
	}
}

// Run
saveToDatabase();
