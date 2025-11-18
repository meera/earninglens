import { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Pricing - Markey HawkEye',
  description: 'Simple, transparent pricing for earnings call video access. Start free, upgrade anytime.',
};

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Explore earnings calls',
    features: [
      'Browse all 7,372 companies',
      'Access company pages',
      'View company information',
      'Community support',
    ],
    cta: 'Current Plan',
    href: '/auth/signin',
    highlighted: false,
    disabled: true,
  },
  {
    name: 'Standard',
    price: '$39',
    period: 'per month',
    description: 'Unlimited access to earnings calls',
    features: [
      'Unlimited full earnings call audio',
      'AI-generated insights & analysis',
      'Complete transcripts',
      'Priority support',
      'Cancel anytime',
    ],
    cta: 'Subscribe Now',
    href: '/api/billing/checkout?plan=standard',
    highlighted: true,
    disabled: false,
  },
];

export default async function PricingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
              <Link href="/pricing" className="text-primary font-medium transition-colors text-sm">
                Pricing
              </Link>
              {session ? (
                <Link
                  href="/billing"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-all text-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/api/auth/google-one-tap"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-all text-sm"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Title */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-text-primary mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary shadow-xl shadow-primary/20'
                  : 'bg-background-muted/40 border border-border'
              } relative`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Recommended
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-text-primary mb-2">{plan.name}</h3>
                <p className="text-text-tertiary text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-text-primary">{plan.price}</span>
                  <span className="text-text-tertiary">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-text-secondary text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center px-6 py-3 rounded-lg font-semibold transition-all ${
                  plan.disabled
                    ? 'bg-background-elevated border border-border text-text-tertiary cursor-not-allowed'
                    : plan.highlighted
                    ? 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20'
                    : 'bg-background-elevated hover:bg-background-muted border border-border text-primary'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-background-muted/40 border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-text-secondary">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>

            <div className="bg-background-muted/40 border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-text-secondary">
                We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.
              </p>
            </div>

            <div className="bg-background-muted/40 border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Is there a free trial?
              </h3>
              <p className="text-text-secondary">
                No free trial currently, but you can explore all company pages and browse earnings calls for free before subscribing.
              </p>
            </div>
          </div>
        </div>
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
