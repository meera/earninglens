import { Suspense } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { UserProfileMenu } from '@/components/UserProfileMenu';
import { getCompanies, getSectors, getTopCompaniesByMarketCap } from '@/lib/db/companies';

export const metadata = {
  title: 'Markey HawkEye - Stock Earnings Call Videos',
  description: 'Browse earnings call videos for 7,600+ public companies. Listen to actual executive voices with synchronized financial data.',
  openGraph: {
    title: 'Markey HawkEye - Stock Earnings Call Videos',
    description: 'Browse earnings call videos for 7,600+ public companies.',
  },
};

function formatMarketCap(marketCap: number | null): string {
  if (!marketCap) return 'N/A';

  const billion = 1_000_000_000;
  const million = 1_000_000;

  if (marketCap >= billion) {
    return `$${(marketCap / billion).toFixed(1)}B`;
  } else if (marketCap >= million) {
    return `$${(marketCap / million).toFixed(0)}M`;
  } else {
    return `$${marketCap.toLocaleString()}`;
  }
}

async function TopCompanies() {
  const topCompanies = await getTopCompaniesByMarketCap(20);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {topCompanies.map((company) => (
        <Link
          key={company.id}
          href={`/companies/${company.slug}`}
          className="group bg-background-muted/40 border border-border rounded-xl p-4 hover:bg-background-muted/60 hover:border-border-accent hover:shadow-lg hover:shadow-accent/10 transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-primary font-bold text-lg group-hover:text-primary-light transition-colors">
                {company.ticker}
              </div>
              <div className="text-text-tertiary text-xs mt-1">{company.metadata.sector || 'N/A'}</div>
            </div>
            <div className="text-xs text-text-tertiary bg-background/50 px-2 py-1 rounded">
              {formatMarketCap(company.metadata.market_cap || null)}
            </div>
          </div>
          <div className="text-text-secondary text-sm line-clamp-2">{company.name}</div>
        </Link>
      ))}
    </div>
  );
}

async function SectorsList() {
  const sectors = await getSectors();

  return (
    <div className="flex flex-wrap gap-2">
      {sectors.map((sector) => (
        <Link
          key={sector.sector}
          href={`/?sector=${encodeURIComponent(sector.sector)}`}
          className="px-4 py-2 bg-background-muted/40 border border-border rounded-lg hover:bg-primary/10 hover:border-primary transition-all text-text-secondary hover:text-primary text-sm"
        >
          {sector.sector} <span className="text-text-tertiary">({sector.count})</span>
        </Link>
      ))}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; search?: string }>;
}) {
  const { sector, search } = await searchParams;
  const companies = await getCompanies({
    sector,
    search,
    limit: 100,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-elevated to-background">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo />

            <nav className="flex items-center space-x-6">
              <Link href="/" className="text-primary font-medium transition-colors text-sm">
                Companies
              </Link>
              <Link href="/pricing" className="text-text-tertiary hover:text-primary transition-colors text-sm">
                Pricing
              </Link>
              <Link href="/about" className="text-text-tertiary hover:text-primary transition-colors text-sm">
                About
              </Link>
              <UserProfileMenu />
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            {search ? `Search Results for "${search}"` : sector ? `${sector} Companies` : 'All Companies'}
          </h1>
          <p className="text-xl text-text-secondary">
            {search
              ? `Found ${companies.length.toLocaleString()} ${companies.length === 1 ? 'company' : 'companies'}`
              : `Browse earnings call videos for 7,600+ public companies`
            }
          </p>
        </div>

        {/* Search Bar - Prominent */}
        <section className="mb-12">
          <form method="get" className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by company name or ticker (e.g., AAPL, Apple, Microsoft)..."
                className="flex-1 px-6 py-4 rounded-lg bg-background-muted border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                autoFocus={!!search}
              />
              <button
                type="submit"
                className="px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-all shadow-lg shadow-primary/20"
              >
                Search
              </button>
              {(search || sector) && (
                <Link
                  href="/"
                  className="px-6 py-4 bg-background-muted hover:bg-background-elevated border border-border text-text-secondary hover:text-primary rounded-lg font-semibold transition-all"
                >
                  Clear
                </Link>
              )}
            </div>
          </form>
        </section>

        {/* Top Companies */}
        {!sector && !search && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Top Companies by Market Cap</h2>
            <Suspense fallback={<div className="text-text-tertiary">Loading...</div>}>
              <TopCompanies />
            </Suspense>
          </section>
        )}

        {/* Sectors Filter */}
        {!sector && !search && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Browse by Sector</h2>
            <Suspense fallback={<div className="text-text-tertiary">Loading...</div>}>
              <SectorsList />
            </Suspense>
          </section>
        )}

        {/* Companies List */}
        <section>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.slug}`}
                className="group bg-background-muted/40 border border-border rounded-xl p-4 hover:bg-background-muted/60 hover:border-border-accent hover:shadow-lg hover:shadow-accent/10 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-primary font-bold text-lg group-hover:text-primary-light transition-colors">
                    {company.ticker}
                  </div>
                  {company.metadata.market_cap && (
                    <div className="text-xs text-text-tertiary bg-background/50 px-2 py-1 rounded">
                      {formatMarketCap(company.metadata.market_cap)}
                    </div>
                  )}
                </div>
                <div className="text-text-secondary text-sm mb-2 line-clamp-2">{company.name}</div>
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  {company.metadata.sector && <span>{company.metadata.sector}</span>}
                  {company.metadata.country && <span>• {company.metadata.country}</span>}
                </div>
              </Link>
            ))}
          </div>

          {companies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-tertiary text-lg">No companies found.</p>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <Logo size="small" />
              <span className="text-text-tertiary text-sm">
                © 2024 Markey HawkEye. Transform earnings calls into visual insights.
              </span>
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <Link href="mailto:thehawkeyemarket@gmail.com" className="text-text-tertiary hover:text-accent transition-colors">
                Contact
              </Link>
              <Link href="/about" className="text-text-tertiary hover:text-accent transition-colors">
                About
              </Link>
              <span className="text-text-tertiary/60">v0.1.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
