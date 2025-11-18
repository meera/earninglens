CREATE TABLE "markethawkeye"."earnings_call_views" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"earnings_call_id" varchar(255) NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"completed" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "markethawkeye"."earnings_calls" RENAME COLUMN "artifacts" TO "transcripts";--> statement-breakpoint
ALTER TABLE "markethawkeye"."earnings_calls" ADD COLUMN "insights" jsonb;--> statement-breakpoint
ALTER TABLE "markethawkeye"."user" ADD COLUMN "subscriptionTier" varchar(50) DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "markethawkeye"."user" ADD COLUMN "stripeCustomerId" varchar(255);--> statement-breakpoint
ALTER TABLE "markethawkeye"."user" ADD COLUMN "stripeSubscriptionId" varchar(255);--> statement-breakpoint
ALTER TABLE "markethawkeye"."user" ADD COLUMN "subscriptionStatus" varchar(50);--> statement-breakpoint
ALTER TABLE "markethawkeye"."user" ADD COLUMN "subscriptionEndsAt" timestamp;--> statement-breakpoint
ALTER TABLE "markethawkeye"."user" ADD COLUMN "dailyViewCount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "markethawkeye"."user" ADD COLUMN "lastViewDate" date;--> statement-breakpoint
ALTER TABLE "markethawkeye"."earnings_call_views" ADD CONSTRAINT "earnings_call_views_earnings_call_id_earnings_calls_id_fk" FOREIGN KEY ("earnings_call_id") REFERENCES "markethawkeye"."earnings_calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_earnings_call_views_user_id" ON "markethawkeye"."earnings_call_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_earnings_call_views_earnings_call_id" ON "markethawkeye"."earnings_call_views" USING btree ("earnings_call_id");--> statement-breakpoint
CREATE INDEX "idx_earnings_call_views_viewed_at" ON "markethawkeye"."earnings_call_views" USING btree ("viewed_at");