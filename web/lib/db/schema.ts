import { pgTable, varchar, timestamp, integer, jsonb, boolean, index, pgSchema } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Define custom schema for MarketHawk (separate from VideotoBe's app_videotobe schema)
// Note: Schema name is 'markethawkeye' in the database
export const markethawkSchema = pgSchema('markethawkeye');

// ============================================
// JSONB SCHEMAS (Type Safety with Zod)
// ============================================

export const companyDataSchema = z.object({
  name: z.string(),
  industry: z.string(),
  sector: z.string().optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  marketCap: z.number().optional(),
  employees: z.number().optional(),
  founded: z.number().optional(),
  headquarters: z.string().optional(),
});

export const sourceDataSchema = z.object({
  sourceUrl: z.string().url(),
  sourceType: z.string(),
  quarter: z.string(),
  year: z.number(),
  mimeType: z.string(),
  fileSize: z.number(),
  duration: z.number().optional(),
  checksum: z.string().optional(),
  r2Path: z.string(),
  r2Url: z.string().url(),
  r2Bucket: z.string(),
  downloadedAt: z.string().optional(),
  processingStatus: z.string().optional(),
  processingResults: z.record(z.string(), z.any()).optional(),
  youtube: z
    .object({
      videoId: z.string(),
      channelId: z.string(),
      uploadDate: z.string(),
      views: z.number(),
    })
    .optional(),
  sec: z
    .object({
      filingType: z.string(),
      accessionNumber: z.string(),
      filedDate: z.string(),
      pages: z.number(),
      extractedTables: z.boolean(),
    })
    .optional(),
  transcript: z
    .object({
      provider: z.string(),
      wordCount: z.number(),
      hasTimestamps: z.boolean(),
      speakers: z.array(z.string()),
    })
    .optional(),
});

export const artifactDataSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  r2Path: z.string(),
  r2Url: z.string().url(),
  generatedFrom: z.array(z.string()),
  generatedAt: z.string(),
  generator: z.string(),
  version: z.string(),
  fileSize: z.number().optional(),
  mimeType: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  chartData: z.any().optional(),
  thumbnail: z.any().optional(),
  transcript: z.array(z.any()).optional(),
});

export const videoDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.number().optional(),
  thumbnailUrl: z.string().url().optional(),
  r2VideoPath: z.string(),
  r2VideoUrl: z.string().url().optional(),
  fileSize: z.number().optional(),
  remotionProps: z.record(z.string(), z.any()).optional(),
  renderConfig: z.record(z.string(), z.any()).optional(),
  renderTime: z.number().optional(),
  renderedAt: z.string().optional(),
  sources: z.array(
    z.object({
      id: z.string(),
      purpose: z.string(),
      usage: z.record(z.string(), z.any()),
    })
  ),
  artifacts: z.array(
    z.object({
      id: z.string(),
      purpose: z.string(),
      timing: z.record(z.string(), z.any()).optional(),
      usage: z.record(z.string(), z.any()).optional(),
    })
  ),
  youtube: z
    .object({
      videoId: z.string(),
      uploadedAt: z.string(),
      visibility: z.string(),
      tags: z.array(z.string()),
      category: z.string(),
      playlist: z.string().optional(),
    })
    .optional(),
  analytics: z
    .object({
      views: z.number(),
      watchTime: z.number(),
      likes: z.number(),
      comments: z.number(),
      lastSyncedAt: z.string(),
    })
    .optional(),
  seo: z
    .object({
      metaTitle: z.string(),
      metaDescription: z.string(),
      ogImage: z.string().url(),
      keywords: z.array(z.string()),
    })
    .optional(),
});

// ============================================
// DATABASE TABLES
// ============================================

// Companies - Public companies we analyze (AAPL, MSFT, etc.)
export const companies = markethawkSchema.table('companies', {
  id: varchar('id', { length: 255 }).primaryKey(), // comp_aapl_a1b2
  ticker: varchar('ticker', { length: 10 }).notNull().unique(), // "AAPL"
  data: jsonb('data').$type<z.infer<typeof companyDataSchema>>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sources - Incoming raw materials (audio, video, documents from internet)
export const sources = markethawkSchema.table(
  'sources',
  {
    id: varchar('id', { length: 255 }).primaryKey(), // avd_audio_yt_aapl_k8m2
    companyId: varchar('company_id', { length: 255 })
      .references(() => companies.id, { onDelete: 'cascade' })
      .notNull(),
    type: varchar('type', { length: 50 }).notNull(), // "audio", "video", "document", "transcript", "sec_filing"
    status: varchar('status', { length: 50 }).notNull().default('pending'), // "pending", "downloading", "downloaded", "processing", "ready", "failed"
    data: jsonb('data').$type<z.infer<typeof sourceDataSchema>>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_sources_company_id').on(table.companyId),
    typeIdx: index('idx_sources_type').on(table.type),
    statusIdx: index('idx_sources_status').on(table.status),
  })
);

// Artifacts - Things we generate (charts, thumbnails, processed audio, etc.)
export const artifacts = markethawkSchema.table(
  'artifacts',
  {
    id: varchar('id', { length: 255 }).primaryKey(), // art_chart_revenue_a2b8
    companyId: varchar('company_id', { length: 255 })
      .references(() => companies.id, { onDelete: 'cascade' })
      .notNull(),
    type: varchar('type', { length: 50 }).notNull(), // "chart", "thumbnail", "audio_clip", "transcript_processed", "overlay"
    status: varchar('status', { length: 50 }).notNull().default('generating'), // "generating", "ready", "failed"
    data: jsonb('data').$type<z.infer<typeof artifactDataSchema>>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_artifacts_company_id').on(table.companyId),
    typeIdx: index('idx_artifacts_type').on(table.type),
    statusIdx: index('idx_artifacts_status').on(table.status),
  })
);

// Videos - Final output (one earnings call video)
export const videos = markethawkSchema.table(
  'videos',
  {
    id: varchar('id', { length: 255 }).primaryKey(), // vid_aapl_q4_2024_x9z3
    companyId: varchar('company_id', { length: 255 })
      .references(() => companies.id, { onDelete: 'cascade' })
      .notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(), // "aapl-q4-2024"
    status: varchar('status', { length: 50 }).notNull().default('draft'), // "draft", "sources_gathering", "rendering", "uploading", "published", "failed"
    quarter: varchar('quarter', { length: 10 }), // "Q4" (for queries)
    year: integer('year'), // 2024 (for queries)
    youtubeId: varchar('youtube_id', { length: 50 }), // YouTube video ID
    data: jsonb('data').$type<z.infer<typeof videoDataSchema>>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    publishedAt: timestamp('published_at'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyIdIdx: index('idx_videos_company_id').on(table.companyId),
    slugIdx: index('idx_videos_slug').on(table.slug),
    statusIdx: index('idx_videos_status').on(table.status),
    youtubeIdIdx: index('idx_videos_youtube_id').on(table.youtubeId),
    quarterYearIdx: index('idx_videos_quarter_year').on(table.quarter, table.year),
  })
);

// Video Views - Analytics (who watched, when, how long)
export const videoViews = markethawkSchema.table(
  'video_views',
  {
    id: varchar('id', { length: 255 }).primaryKey(), // view_m8n9_p2q7
    videoId: varchar('video_id', { length: 255 })
      .references(() => videos.id, { onDelete: 'cascade' })
      .notNull(),
    userId: varchar('user_id', { length: 255 }), // Better Auth user.id (nullable for anonymous)
    sessionId: varchar('session_id', { length: 255 }), // Anonymous session tracking
    data: jsonb('data').notNull(), // source, device, duration, etc.
    createdAt: timestamp('created_at').defaultNow().notNull(), // When view happened
  },
  (table) => ({
    videoIdIdx: index('idx_video_views_video_id').on(table.videoId),
    userIdIdx: index('idx_video_views_user_id').on(table.userId),
    createdAtIdx: index('idx_video_views_created_at').on(table.createdAt),
  })
);

// Video Engagement - User interactions (play, pause, chart clicks, downloads)
export const videoEngagement = markethawkSchema.table(
  'video_engagement',
  {
    id: varchar('id', { length: 255 }).primaryKey(), // eng_k4m8_x2y9
    videoId: varchar('video_id', { length: 255 })
      .references(() => videos.id, { onDelete: 'cascade' })
      .notNull(),
    userId: varchar('user_id', { length: 255 }), // Better Auth user.id (nullable)
    eventType: varchar('event_type', { length: 50 }).notNull(), // "play", "pause", "chart_interact", "download", "paywall_hit"
    data: jsonb('data').notNull(), // Event-specific data
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    videoIdIdx: index('idx_video_engagement_video_id').on(table.videoId),
    eventTypeIdx: index('idx_video_engagement_event_type').on(table.eventType),
    createdAtIdx: index('idx_video_engagement_created_at').on(table.createdAt),
  })
);

// Click Throughs - YouTube → Website conversion tracking
export const clickThroughs = markethawkSchema.table(
  'click_throughs',
  {
    id: varchar('id', { length: 255 }).primaryKey(), // ct_a1b2_c3d4
    videoId: varchar('video_id', { length: 255 })
      .references(() => videos.id, { onDelete: 'cascade' })
      .notNull(),
    userId: varchar('user_id', { length: 255 }), // Better Auth user.id (nullable)
    data: jsonb('data').notNull(), // destination, source, device, etc.
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    videoIdIdx: index('idx_click_throughs_video_id').on(table.videoId),
    createdAtIdx: index('idx_click_throughs_created_at').on(table.createdAt),
  })
);

// Newsletter Subscribers - Email list for updates
export const newsletterSubscribers = markethawkSchema.table(
  'newsletter_subscribers',
  {
    id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
    email: varchar('email', { length: 255 }).notNull().unique(),
    subscribedAt: timestamp('subscribed_at').defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at'),
    unsubscribedAt: timestamp('unsubscribed_at'),
  },
  (table) => ({
    emailIdx: index('idx_newsletter_email').on(table.email),
  })
);

// ============================================
// EARNINGS CALLS (Batch Processing Pipeline)
// ============================================

/**
 * Earnings Calls Table - Batch processed audio files
 *
 * This table is populated by the batch processing pipeline (lens/batch_processor.py)
 * after successfully processing YouTube earnings call videos.
 *
 * Database: PostgreSQL at 192.168.86.250:54322
 * Schema: markethawkeye
 * Created: Manually via SQL (drizzle migration failed due to version mismatch)
 *
 * Metadata JSONB fields (examples):
 * - company_name: string (e.g., "NVIDIA CORP")
 * - company_slug: string (e.g., "nvidia")
 * - is_earnings_call: boolean
 * - speakers: array of speaker objects
 * - financial_metrics: array of metric objects
 * - highlights: array of highlight objects
 * - job_id: string (e.g., "xw6oCFYNz8c_a328")
 * - batch_name: string (e.g., "nov-13-2025-test")
 * - pipeline_version: string (e.g., "v1", "audio-only")
 * - r2_path: string (full R2 path to audio file)
 * - public_url: string (public R2 URL)
 * - source_youtube_url: string
 * - source_youtube_title: string
 * - duration_seconds: number
 * - file_size_mb: number
 */
export const earningsCalls = markethawkSchema.table(
  'earnings_calls',
  {
    id: varchar('id', { length: 255 }).primaryKey(), // Format: {SYMBOL}-{QUARTER}-{YEAR}-{BATCH_CODE} (e.g., AEHR-Q4-2023-m7k9)
    cikStr: varchar('cik_str', { length: 20 }).notNull(), // SEC Central Index Key
    symbol: varchar('symbol', { length: 10 }).notNull(), // Stock ticker (e.g., NVDA)
    quarter: varchar('quarter', { length: 10 }).notNull(), // Q1, Q2, Q3, Q4
    year: integer('year').notNull(), // Fiscal year
    mediaUrl: varchar('media_url', { length: 512 }), // Public R2 URL to primary media (audio/video)
    isLatest: boolean('is_latest').notNull().default(true), // Latest version flag (true = current, false = superseded)
    metadata: jsonb('metadata').$type<Record<string, any>>().default({}), // Pipeline metadata (batch_code, job_id, youtube_id, etc.)
    artifacts: jsonb('artifacts').$type<Record<string, any>>().default({}), // Artifacts (transcript, insights, thumbnails, etc.)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    symbolIdx: index('idx_earnings_calls_symbol').on(table.symbol),
    quarterYearIdx: index('idx_earnings_calls_quarter_year').on(table.quarter, table.year),
  })
);

// ============================================
// RELATIONS
// ============================================

export const companiesRelations = relations(companies, ({ many }) => ({
  sources: many(sources),
  artifacts: many(artifacts),
  videos: many(videos),
}));

export const sourcesRelations = relations(sources, ({ one }) => ({
  company: one(companies, {
    fields: [sources.companyId],
    references: [companies.id],
  }),
}));

export const artifactsRelations = relations(artifacts, ({ one }) => ({
  company: one(companies, {
    fields: [artifacts.companyId],
    references: [companies.id],
  }),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  company: one(companies, {
    fields: [videos.companyId],
    references: [companies.id],
  }),
  views: many(videoViews),
  engagement: many(videoEngagement),
  clickThroughs: many(clickThroughs),
}));

export const videoViewsRelations = relations(videoViews, ({ one }) => ({
  video: one(videos, {
    fields: [videoViews.videoId],
    references: [videos.id],
  }),
}));

export const videoEngagementRelations = relations(videoEngagement, ({ one }) => ({
  video: one(videos, {
    fields: [videoEngagement.videoId],
    references: [videos.id],
  }),
}));

export const clickThroughsRelations = relations(clickThroughs, ({ one }) => ({
  video: one(videos, {
    fields: [clickThroughs.videoId],
    references: [videos.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;

export type Artifact = typeof artifacts.$inferSelect;
export type NewArtifact = typeof artifacts.$inferInsert;

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

export type VideoView = typeof videoViews.$inferSelect;
export type NewVideoView = typeof videoViews.$inferInsert;

export type VideoEngagement = typeof videoEngagement.$inferSelect;
export type NewVideoEngagement = typeof videoEngagement.$inferInsert;

export type ClickThrough = typeof clickThroughs.$inferSelect;
export type NewClickThrough = typeof clickThroughs.$inferInsert;

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

export type EarningsCall = typeof earningsCalls.$inferSelect;
export type NewEarningsCall = typeof earningsCalls.$inferInsert;

// ============================================
// BETTER AUTH TABLES
// ============================================

// Import and re-export Better Auth tables for drizzle adapter
export {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
} from './auth-schema';
