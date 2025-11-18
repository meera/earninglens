import Link from 'next/link';

export const metadata = {
  title: 'Pricing | MarketHawk',
  description: 'Simple, transparent pricing for earnings call insights',
};

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Explore earnings calls',
      features: [
        'Browse all 7,372 companies',
        'View company information',
        'Access public earnings calls',
        'Community support',
      ],
      cta: 'Get Started',
      href: '/auth/signin',
      highlighted: false,
    },
    {
      name: 'Standard',
      price: '$39',
      period: 'per month',
      description: 'Unlimited access to earnings calls',
      features: [
        'Everything in Free',
        'Unlimited full earnings call audio/video',
        'AI-generated insights & analysis',
        'Complete transcripts with search',
        'Sentiment analysis',
        'Key highlights & metrics',
        'Priority support',
        'Cancel anytime',
      ],
      cta: 'Subscribe Now',
      // TODO: Replace with proper checkout flow once Stripe integration is complete
      href: 'https://buy.stripe.com/9B65kCbaj0vc0CJbUu6AM00',
      highlighted: true,
      external: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-elevated">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary">
              MarketHawk
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/" className="text-text-tertiary hover:text-primary transition-colors text-sm">
                Companies
              </Link>
              <Link href="/pricing" className="text-primary font-medium transition-colors text-sm">
                Pricing
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-8 ${
                plan.highlighted
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background-elevated'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-medium rounded-full">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-text-primary mb-2">
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span className="text-5xl font-bold text-text-primary">
                    {plan.price}
                  </span>
                  <span className="text-text-secondary ml-2">
                    {plan.period}
                  </span>
                </div>
                <p className="text-text-secondary">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-6 w-6 text-primary flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                target={plan.external ? '_blank' : undefined}
                rel={plan.external ? 'noopener noreferrer' : undefined}
                className={`block w-full py-3 px-6 rounded-lg text-center font-medium transition-colors ${
                  plan.highlighted
                    ? 'bg-primary text-white hover:bg-primary-hover'
                    : 'bg-background-muted text-text-primary hover:bg-border'
                }`}
              >
                {plan.cta}
              </Link>

              {plan.external && (
                <p className="text-xs text-text-tertiary text-center mt-4">
                  You'll be redirected to Stripe to complete payment
                </p>
              )}
            </div>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-text-secondary">
            Questions? Email us at{' '}
            <a
              href="mailto:support@markethawkeye.com"
              className="text-primary hover:underline"
            >
              support@markethawkeye.com
            </a>
          </p>
        </div>

        {/* TODO Note */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm text-yellow-800">
            <strong>TODO:</strong> Implement proper Stripe integration with Better Auth plugin
            and bookkeeping for subscription management. Current flow uses direct Stripe payment link.
          </p>
        </div>
      </div>
    </div>
  );
}
