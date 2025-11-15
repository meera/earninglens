CREATE SCHEMA "markethawkeye";
--> statement-breakpoint
CREATE TABLE "markethawkeye"."account" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."artifacts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'generating' NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."click_throughs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"video_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."companies" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_ticker_unique" UNIQUE("ticker")
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."earnings_calls" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"cik_str" varchar(20) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"quarter" varchar(10) NOT NULL,
	"year" integer NOT NULL,
	"audio_url" varchar(512),
	"youtube_id" varchar(50),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."invitation" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organizationId" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'member',
	"status" varchar(50) DEFAULT 'pending',
	"expiresAt" timestamp NOT NULL,
	"inviterId" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."member" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organizationId" varchar(255) NOT NULL,
	"userId" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."newsletter_subscribers" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."organization" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"logo" varchar(512),
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."session" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" varchar(255) NOT NULL,
	"ipAddress" varchar(45),
	"userAgent" varchar(512),
	"activeOrganizationId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."sources" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."verification" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."video_engagement" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"video_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"event_type" varchar(50) NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."video_views" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"video_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"session_id" varchar(255),
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markethawkeye"."videos" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"quarter" varchar(10),
	"year" integer,
	"youtube_id" varchar(50),
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "videos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "markethawkeye"."account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "markethawkeye"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markethawkeye"."artifacts" ADD CONSTRAINT "artifacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "markethawkeye"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markethawkeye"."click_throughs" ADD CONSTRAINT "click_throughs_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "markethawkeye"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markethawkeye"."invitation" ADD CONSTRAINT "invitation_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "markethawkeye"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markethawkeye"."invitation" ADD CONSTRAINT "invitation_inviterId_user_id_fk" FOREIGN KEY ("inviterId") REFERENCES "markethawkeye"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markethawkeye"."member" ADD CONSTRAINT "member_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "markethawkeye"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markethawkeye"."member" ADD CONSTRAINT "member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "markethawkeye"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markethawkeye"."session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "markethawkeye"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markethawkeye"."sources" ADD CONSTRAINT "sources_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "markethawkeye"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markethawkeye"."video_engagement" ADD CONSTRAINT "video_engagement_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "markethawkeye"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markethawkeye"."video_views" ADD CONSTRAINT "video_views_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "markethawkeye"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markethawkeye"."videos" ADD CONSTRAINT "videos_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "markethawkeye"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_artifacts_company_id" ON "markethawkeye"."artifacts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_artifacts_type" ON "markethawkeye"."artifacts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_artifacts_status" ON "markethawkeye"."artifacts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_click_throughs_video_id" ON "markethawkeye"."click_throughs" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "idx_click_throughs_created_at" ON "markethawkeye"."click_throughs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_earnings_calls_symbol" ON "markethawkeye"."earnings_calls" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "idx_earnings_calls_quarter_year" ON "markethawkeye"."earnings_calls" USING btree ("quarter","year");--> statement-breakpoint
CREATE INDEX "idx_earnings_calls_unique" ON "markethawkeye"."earnings_calls" USING btree ("cik_str","quarter","year");--> statement-breakpoint
CREATE INDEX "idx_newsletter_email" ON "markethawkeye"."newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_sources_company_id" ON "markethawkeye"."sources" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_sources_type" ON "markethawkeye"."sources" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_sources_status" ON "markethawkeye"."sources" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_video_engagement_video_id" ON "markethawkeye"."video_engagement" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "idx_video_engagement_event_type" ON "markethawkeye"."video_engagement" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_video_engagement_created_at" ON "markethawkeye"."video_engagement" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_video_views_video_id" ON "markethawkeye"."video_views" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "idx_video_views_user_id" ON "markethawkeye"."video_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_video_views_created_at" ON "markethawkeye"."video_views" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_videos_company_id" ON "markethawkeye"."videos" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_videos_slug" ON "markethawkeye"."videos" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_videos_status" ON "markethawkeye"."videos" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_videos_youtube_id" ON "markethawkeye"."videos" USING btree ("youtube_id");--> statement-breakpoint
CREATE INDEX "idx_videos_quarter_year" ON "markethawkeye"."videos" USING btree ("quarter","year");