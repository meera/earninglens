import { db } from '@/lib/db';
import { videos, companies } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { GoogleOneTap } from '@/components/auth/GoogleOneTap';
import Link from 'next/link';

// ISR: Revalidate every hour
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch published videos with company data
  const latestVideos = await db
    .select({
      video: videos,
      company: companies,
    })
    .from(videos)
    .leftJoin(companies, eq(videos.companyId, companies.id))
    .where(eq(videos.status, 'published'))
    .orderBy(desc(videos.publishedAt))
    .limit(12);

  return (
    <>
      <GoogleOneTap />

      <div className="min-h-screen bg-background">
        {/* Header - YouTube style minimal */}
        <header className="border-b border-border bg-background sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <h1 className="text-xl font-semibold text-text-primary">
                  EarningLens
                </h1>
              </div>

              <nav className="flex items-center space-x-6">
                <Link href="/videos" className="text-text-secondary hover:text-text-primary transition-colors duration-100">
                  Videos
                </Link>
                <Link href="/companies" className="text-text-secondary hover:text-text-primary transition-colors duration-100">
                  Companies
                </Link>
                <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-full transition-colors duration-100 text-sm font-medium">
                  Sign In
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary">
              Earnings Calls,{' '}
              <span className="text-primary">
                Visually Enhanced
              </span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Transform boring earnings call audio into engaging visual summaries with charts, transcripts, and data-driven insights.
            </p>
            <div className="flex items-center justify-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{latestVideos.length}+</div>
                <div className="text-sm text-text-tertiary">Videos</div>
              </div>
              <div className="w-px h-10 bg-border-light" />
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">50+</div>
                <div className="text-sm text-text-tertiary">Companies</div>
              </div>
              <div className="w-px h-10 bg-border-light" />
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">Q4 2024</div>
                <div className="text-sm text-text-tertiary">Latest</div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-text-primary mb-1">Latest Earnings Calls</h3>
            <p className="text-text-secondary text-sm">Watch visual summaries of recent earnings calls</p>
          </div>

          {latestVideos.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-semibold text-text-primary mb-2">Coming Soon</h3>
              <p className="text-text-secondary">
                We're generating amazing earnings call videos. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {latestVideos.map(({ video, company }) => (
                <Link
                  key={video.id}
                  href={`/${company?.ticker.toLowerCase()}/${video.slug}`}
                  className="group"
                >
                  <div className="rounded-xl overflow-hidden hover:bg-background-hover transition-colors duration-100">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-background-elevated">
                      {video.data.thumbnailUrl ? (
                        <img
                          src={video.data.thumbnailUrl}
                          alt={video.data.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-4xl">
                            {company?.data.logoUrl ? '🏢' : '📊'}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/90 rounded text-xs text-white font-medium">
                        {video.data.duration ? (
                          `${Math.floor(video.data.duration / 60)}:${String(video.data.duration % 60).padStart(2, '0')}`
                        ) : '0:00'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-text-primary mb-1 line-clamp-2 leading-tight">
                        {video.data.title}
                      </h4>
                      <div className="flex items-center space-x-1 text-xs text-text-tertiary mb-1">
                        <span className="font-semibold text-text-secondary">
                          {company?.ticker}
                        </span>
                        <span>•</span>
                        <span>{video.quarter} {video.year}</span>
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {video.data.analytics?.views || 0} views
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-border mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-text-tertiary text-xs">
              © 2024 EarningLens. Transform earnings calls into visual insights.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
