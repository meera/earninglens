import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { getCompanyByTicker, getCompaniesBySector } from '@/lib/db/companies';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    ticker: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ticker } = await params;
  const company = await getCompanyByTicker(ticker);

  if (!company) {
    return {
      title: 'Company Not Found - Markey HawkEye',
    };
  }

  return {
    title: `${company.symbol} - ${company.name} | Markey HawkEye`,
    description: `Watch earnings call videos for ${company.name} (${company.symbol}). Hear actual executive voices with synchronized financial data. ${company.metadata.sector ? `Sector: ${company.metadata.sector}.` : ''} ${company.metadata.industry ? `Industry: ${company.metadata.industry}.` : ''}`,
    openGraph: {
      title: `${company.symbol} - ${company.name}`,
      description: `Watch earnings call videos for ${company.name}. Hear what transcripts can't show.`,
      type: 'website',
    },
  };
}

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

function formatNumber(num: number | null): string {
  if (num === null) return 'N/A';
  return num.toLocaleString();
}

function formatPercentage(pct: string | null): string {
  if (!pct) return 'N/A';
  return pct;
}

export default async function CompanyPage({ params }: PageProps) {
  const { ticker } = await params;
  const company = await getCompanyByTicker(ticker);

  if (!company) {
    notFound();
  }

  // Get related companies in same sector
  const relatedCompanies = company.metadata.sector
    ? (await getCompaniesBySector(company.metadata.sector, 8)).filter((c) => c.id !== company.id)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-elevated to-background">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo />

            <nav className="flex items-center space-x-6">
              <Link href="/" className="text-text-tertiary hover:text-primary transition-colors text-sm">
                Companies
              </Link>
              <Link href="/about" className="text-text-tertiary hover:text-primary transition-colors text-sm">
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-text-tertiary mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            All Companies
          </Link>
          <span>→</span>
          {company.metadata.sector && (
            <>
              <Link
                href={`/?sector=${encodeURIComponent(company.metadata.sector)}`}
                className="hover:text-primary transition-colors"
              >
                {company.metadata.sector}
              </Link>
              <span>→</span>
            </>
          )}
          <span className="text-text-secondary">{company.symbol}</span>
        </div>

        {/* Company Header */}
        <div className="bg-background-muted/40 border border-border rounded-2xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-text-primary mb-2">{company.name}</h1>
              <div className="flex items-center gap-4 text-text-tertiary">
                <span className="text-primary font-bold text-xl">{company.symbol}</span>
                {company.metadata.sector && <span>• {company.metadata.sector}</span>}
                {company.metadata.exchange && <span>• {company.metadata.exchange}</span>}
              </div>
            </div>
            {company.metadata.market_cap && (
              <div className="text-right">
                <div className="text-sm text-text-tertiary mb-1">Market Cap</div>
                <div className="text-2xl font-bold text-primary">{formatMarketCap(company.metadata.market_cap)}</div>
              </div>
            )}
          </div>

          {/* Company Details */}
          <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-border">
            <div>
              <div className="text-sm text-text-tertiary mb-1">Industry</div>
              <div className="text-text-secondary">{company.metadata.industry || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-text-tertiary mb-1">IPO Year</div>
              <div className="text-text-secondary">{company.metadata.ipo_year || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-text-tertiary mb-1">Country</div>
              <div className="text-text-secondary">{company.metadata.country || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Earnings Calls Section */}
        <div className="bg-background-muted/40 border border-border rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Earnings Call Videos</h2>
          <div className="bg-background/50 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-text-secondary text-lg mb-4">
              Earnings call videos for <strong className="text-primary">{company.symbol}</strong> are coming soon.
            </p>
            <p className="text-text-tertiary">
              We're transforming earnings calls into visual insights. Subscribe to get notified when videos are
              available.
            </p>
            <Link
              href="/#subscribe"
              className="inline-block mt-6 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-all"
            >
              Get Notified
            </Link>
          </div>
        </div>

        {/* Related Companies */}
        {relatedCompanies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              More Companies in {company.metadata.sector}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedCompanies.map((related) => (
                <Link
                  key={related.id}
                  href={`/companies/${related.slug}`}
                  className="group bg-background-muted/40 border border-border rounded-xl p-4 hover:bg-background-muted/60 hover:border-border-accent hover:shadow-lg hover:shadow-accent/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-primary font-bold text-lg group-hover:text-primary-light transition-colors">
                      {related.symbol}
                    </div>
                    {related.metadata.market_cap && (
                      <div className="text-xs text-text-tertiary bg-background/50 px-2 py-1 rounded">
                        {formatMarketCap(related.metadata.market_cap)}
                      </div>
                    )}
                  </div>
                  <div className="text-text-secondary text-sm line-clamp-2">{related.name}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
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
              <Link
                href="mailto:thehawkeyemarket@gmail.com"
                className="text-text-tertiary hover:text-accent transition-colors"
              >
                Contact
              </Link>
              <Link href="/about" className="text-text-tertiary hover:text-accent transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
